// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";

contract IkmzForwarder is
  Initializable,
  PausableUpgradeable,
  AccessControlUpgradeable,
  UUPSUpgradeable,
  EIP712Upgradeable
{
  using ECDSAUpgradeable for bytes32;
  bytes32 private constant _TYPEHASH =
    keccak256(
      "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"
    );
  bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

  struct ForwardRequest {
    address from;
    address to;
    uint256 value;
    uint256 gas;
    uint256 nonce;
    bytes data;
  }

  mapping(address => uint256) private _nonces;

  // 送金元アドレス（msg.sender）と送金額（msg.value）
  event Deposit(address indexed sender, uint256 value);
  event Withdraw(address indexed sender, uint256 value);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {}

  function initialize(address _admin, address _executor) public initializer {
    __Pausable_init();
    __AccessControl_init();
    __UUPSUpgradeable_init();
    __EIP712_init("IkmzForwarder", "0.0.1");

    _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    _grantRole(EXECUTOR_ROLE, _executor);
  }

  // deposit 関数はユーザーが指定した金額のEtherをコントラクトに送金できるようにし、そのトランザクションが行われると Deposit イベントを発行して、その詳細を記録します
  // payable: Etherを受け付けることができることを示す
  function deposit() public payable {
    require(
      msg.value > 0,
      "IkmzForwarder: deposit value must be greater than 0"
    );
    emit Deposit(msg.sender, msg.value);
  }

  // EXECUTOR が Ether を引き出す
  function withdraw(address _executor, uint256 _amount)
    public
    onlyRole(EXECUTOR_ROLE)
  {
    require(
      _amount > 0,
      "IkmzForwarder: withdraw value must be greater than 0"
    );

    // お財布残高を確認
    require(
      _amount <= address(this).balance,
      "IkmzForwarder: withdraw value must be less than balance"
    );

    // `_executor` に `_amount` 分の Ether を送金
    payable(_executor).transfer(_amount);
    emit Withdraw(_executor, _amount);
  }

  function getNonce(address _from) public view returns (uint256) {
    return _nonces[_from];
  }

  // フロントからブロードキャストされた ForwardRequest オブジェクトと EIP712Sig _signature を使用して、トランザクションの透明性を検証
  function verify(ForwardRequest calldata _req, bytes calldata _signature)
    public
    view
    returns (bool)
  {

    // _hashTypedDataV4 nodule で与えられた関数を使用してメッセージハッシュを計算
    // そのハッシュに対する署名のアドレス（signer）を取得
    address signer = _hashTypedDataV4(
      keccak256(
        abi.encode(
          _TYPEHASH,
          _req.from,
          _req.to,
          _req.value,
          _req.gas,
          _req.nonce,
          keccak256(_req.data)
        )
      )
    ).recover(_signature);

    // ノンスと署名のアドレスが条件を満たすかどうかを検証
    return _nonces[_req.from] == _req.nonce && signer == _req.from;
  }

  // 1 endpoint
  function execute(ForwardRequest calldata _req, bytes calldata _signature)
    public
    payable
    onlyRole(EXECUTOR_ROLE)
    whenNotPaused
    returns (bool, bytes memory)
  {
    require(
      verify(_req, _signature),
      "IkmzForwarder: eip712signature does not match request"
    );

    // 現在の残存ガスを取得して、変数 startGas に初期化します
    uint256 startGas = gasleft();

    // 特定のアドレス（_req.from）のノンスを1増やします
    // ノンスはEthereumトランザクションで順序をつけ、リプレイアタックを防ぐために使用されます
    _nonces[_req.from] = _req.nonce + 1;

    // _req.to の CA にある call 関数を実行
    // success は呼び出しが成功した場合に true , それ以外は false
    // returndata には呼び出されたコントラクトから返されたデータを格納
    (bool success, bytes memory returndata) = _req.to.call{
      gas: _req.gas, // TODO: フロントでコール時に指定する
      value: _req.value // TODO: フロントでコール時に指定する
    }(abi.encodePacked(_req.data, _req.from));

    // meta tx sequences
    // front broadcast by TransactionSigner --> GasRelay(Signs&Send Request)--> Trusted Forwarder(sendAndVerify(request))
    // See https://zenn.dev/pokena/articles/95f3cb4e7ba212#%E2%91%A0transactionsigner--%3E-gasrelay(signs%26send-request)

    // Validate that the relayer has sent enough gas for the call.
    // See https://ronan.eth.limo/blog/ethereum-gas-dangers/
    
    // TODO: broadcast する gas の指定を最適化するべき

    // この種の検証は、リレータが適切なガスを提供しない場合に、攻撃者がリプレイアタックなどの悪意のある行動を行うのを防ぐために使用されます。
    // リレータが提供した残存ガスが、要求されたガスの63分の1以下である
    if (gasleft() <= _req.gas / 63) {
      // We explicitly trigger invalid opcode to consume all gas and bubble-up the effects, since
      // neither revert or assert consume all gas since Solidity 0.8.0
      // https://docs.soliditylang.org/en/v0.8.0/control-structures.html#panic-via-assert-and-error-via-require
      /// @solidity memory-safe-assembly
      // この手法は、無効なオペコードによって明示的にエラーを引き起こすことで、呼び出し元にエラーを通知し、残っているガスを消費している点に注意が必要です。これはガス不足による攻撃を回避するための手段の一つです
      assembly {
        invalid()
      }
    }

    if (!success) {
      // See https://ethereum.stackexchange.com/a/83577
      if (returndata.length < 68) revert("IkmzForwarder: execute reverted");
      assembly {
        returndata := add(returndata, 0x04) //  戻りデータの先頭4バイトをスキップ
      }
      revert(abi.decode(returndata, (string)));
    }

    // gasUsed: トランザクションの実行に使用されたガス使用量 [gas]
    // gasPrice: トランザクションのガス価格 [Gwei/gas]
    // refundAmount: 引き出し手数料と追加のガス
    uint256 gasUsed = startGas - gasleft();
    uint256 gasPrice = tx.gasprice;
    uint256 refundAmount = (gasUsed * gasPrice) + 1e14; // 0.0001 ETH for withdrawal fee + extra gas

    // msg.sender = executer が refundAmount を引き出します
    withdraw(msg.sender, refundAmount);

    return (success, returndata);
  }

  function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }
  
  function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }

  // must func: Contract "IkmzForwarder" should be marked as abstract.solidity(3656)
  // この関数はアップグレード時に自動的に呼び出されます
  // この関数がデフォルトの実装を持っておらず、空のブロックであるため、アップグレードが常に許可されるようになっています
  function _authorizeUpgrade(address _newImplementation)
    internal
    override
    onlyRole(DEFAULT_ADMIN_ROLE)
  {}

  receive() external payable {}

  fallback() external payable {}
}