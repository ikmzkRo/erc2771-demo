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

  // 
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

  // TODO: function execute()

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