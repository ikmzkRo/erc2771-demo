// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

interface BaseIERC721 {
    function balanceOf(address owner) external view returns (uint256);
}

contract BaseERC20 {
    BaseIERC721 public baseIERC721;

    /// @dev Tokenの名前
    string private _name;

    /// @dev Tokenのシンボル
    string private _symbol;

    /// @dev Tokenの総供給数
    uint256 constant _totalSupply = 1000;

    /// @dev baseERC20が所有するTokenの総額
    uint256 private _bankTotalDeposit;

    /// @dev baseERC20のオーナー
    address public owner;

    /// @dev アカウントアドレス毎のToken残高
    mapping(address => uint256) private _balances;

    /// @dev baseERC20が所有するToken残高
    mapping(address => uint256) private _tokenBankBalances;

    /// @dev Token移転時のイベント
    event TokenTransfer(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    /// @dev Token預入時のイベント
    event TokenDeposit(address indexed from, uint256 amount);

    /// @dev Token引出時のイベント
    event TokenWithdraw(address indexed from, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        address nftContract_
    ) {
        _name = name_;
        _symbol = symbol_;
        owner = msg.sender;
        _balances[owner] = _totalSupply;
        baseIERC721 = BaseIERC721(nftContract_);
    }

    /// @dev NFTメンバーのみ
    /**
     * @dev
     * modifier: コントラクト側から制限をかける
     * NFTを1つ以上保持していれば次の処理へ進む
     */
    modifier onlyMember() {
        require(baseIERC721.balanceOf(msg.sender) > 0, "not NFT member");
        _;
    }

    /// @dev オーナー以外
    modifier notOwner() {
        require(owner != msg.sender, "Owner cannot execute");
        _;
    }

    /// @dev Tokenの名前を返す
    // publicとすることで外部から読み取り可能になる
    // viewは読み取り専用
    function name() public view returns (string memory) {
        return _name;
    }

    /// @dev Tokenのシンボルを返す
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    /// @dev Tokenの総供給数を返す
    // 定数を返却するのでpureを使う(view=Relevant source part starts here and spans across multiple lines)
    // 数値なのでuint256型
    function totalSupply() public pure returns (uint256) {
        return _totalSupply;
    }

    /// @dev 指定アカウントアドレスのToken残高を返す
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    /// @dev Tokenを移転する
    function transfer(address to, uint256 amount) public onlyMember {
        if (owner == msg.sender) {
            require(
                _balances[owner] - _bankTotalDeposit >= amount,
                "Amounts greater than the total supply cannot be transferred"
            );
        }
        address from = msg.sender;
        _transfer(from, to, amount);
    }

    /// @dev transfer内部の移転処理
    function _transfer(address from, address to, uint256 amount) internal {
        // Zero address cannot be specified for 'to'!
        require(to != address(0), "E:ZACBSFT");
        uint256 fromBalance = _balances[from];

        // Insufficient balance!
        require(fromBalance >= amount, "E:IB");

        _balances[from] = fromBalance - amount;
        _balances[to] += amount;

        // frontでイベント通知
        emit TokenTransfer(from, to, amount);
    }

    /// @dev baseERC20が所有するTokenの総額を返す
    function bankTotalDeposit() public view returns (uint256) {
        return _bankTotalDeposit;
    }

    /// @dev baseERC20が所有する指定のアカウントアドレスのToken数を返す
    function bankBalanceOf(address account) public view returns (uint256) {
        return _tokenBankBalances[account];
    }

    /// @dev Tokenを預ける
    function deposit(uint256 amount) public onlyMember notOwner {
        address from = msg.sender;
        address to = owner; // baseERC20コントラクトのオーナー

        _transfer(from, to, amount);

        _tokenBankBalances[from] += amount;
        _bankTotalDeposit += amount;
        emit TokenDeposit(from, amount);
    }

    /// @dev Tokenを引き出す
    function withdraw(uint256 amount) public onlyMember notOwner {
        address to = msg.sender;
        address from = owner;
        uint256 toTokenBankBalance = _tokenBankBalances[to];
        require(
            toTokenBankBalance >= amount,
            "An amount greater than your tokenBank balance!"
        );
        _transfer(from, to, amount);
        _tokenBankBalances[to] -= amount;
        _bankTotalDeposit -= amount;
        emit TokenWithdraw(to, amount);
    }
}
