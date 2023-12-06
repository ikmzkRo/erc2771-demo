// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC721, Context} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

// TODO: import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";も使える。使わない理由は？
// https://github.com/ikeda1729/defender-meta-txs-polygon-testnet/blob/master/contracts/Registry.sol

contract IkmzERC721 is ERC721, ERC721Enumerable, AccessControl, ERC2771Context {
    using Counters for Counters.Counter;
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant URIUPDATER_ROLE = keccak256("URIUPDATER_ROLE");
    bytes32 public constant APPROVER_ROLE = keccak256("APPROVER_ROLE");

    // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    Counters.Counter private _tokenIdTracker;

    string private _baseTokenURI;

    // TODO: 既にトークン発行したかどうかは、tokenOfOwnerByIndexを利用すれば解決するはずなので不要とするかもしれない
    mapping(address => bool) private hasMinted;
    address[] private mintedMembers;

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        address admin,
        address Trustedforwarder
    ) ERC721(name, symbol) ERC2771Context(Trustedforwarder) {
        _baseTokenURI = baseTokenURI;
        _tokenIdTracker.increment();

        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(MINTER_ROLE, admin);
        _setupRole(BURNER_ROLE, admin);
        _setupRole(EXECUTOR_ROLE, admin);
        _setupRole(URIUPDATER_ROLE, admin);
        _setupRole(APPROVER_ROLE, admin);
    }

    /// @dev NFTを新しく発行する関数
    /// @param _to 新しく発行したNFTを受け取るアドレス
    // TODO: bulkMint時に毎回requireを呼ぶとガス代に影響しないのか後で検証する
    // TODO: 前述の通り、tokenOfOwnerByIndexを用いれば不要になるか・・・
    function mint(address _to) public {
        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "IkmzERC721: must have minter role to mint"
        );

        if (!hasMinted[_to]) {
            mintedMembers.push(_to);
            hasMinted[_to] = true;
        }

        uint256 tokenId = _tokenIdTracker.current();
        _mint(_to, tokenId);
        _tokenIdTracker.increment();
    }

    /// @dev 一括でNFTを新しく発行する関数
    /// @param _tos 新しく発行したNFTを受け取るアドレスのリスト
    function bulkMint(address[] calldata _tos) public {
        for (uint256 i = 0; i < _tos.length; i++) {
            mint(_tos[i]);
        }
    }

    /// @dev トークンID (NFT) を破棄する関数
    /// @param _tokenId 破棄するトークンID
    // TODO: bulkBurn時に毎回requireを呼ぶとガス代に影響しないのか後で検証する
    function burn(uint256 _tokenId) public virtual {
        require(
            hasRole(BURNER_ROLE, _msgSender()),
            "IkmzERC721: must have burner role to burn"
        );
        require(
            _isApprovedOrOwner(_msgSender(), _tokenId),
            "IkmzERC721: burn caller is not owner nor approved"
        );
        _burn(_tokenId);
    }

    /// @dev 一括でNFTを破棄する関数
    /// @param _tokenIds 破棄するトークンIDのリスト
    function bulkBurn(uint256[] calldata _tokenIds) public {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            burn(_tokenIds[i]);
        }
    }

    /// @dev 一括でNFTを破棄する関数
    /// @param _froms 送信元アドレスのリスト
    /// @param _tos 送信先アドレスのリスト
    /// @param _tokenIds 転送するトークンIDのリスト
    function bulkTransfer(
        address[] calldata _froms,
        address[] calldata _tos,
        uint256[] calldata _tokenIds
    ) external {
        require(
            _froms.length == _tos.length && _froms.length == _tokenIds.length,
            "IkmzERC721: input arrays length mismatch"
        );

        for (uint256 i = 0; i < _froms.length; i++) {
            safeTransferFrom(_froms[i], _tos[i], _tokenIds[i]);
        }
    }

    // 継承元のコントラクト間で同じ名前とパラメータータイプの関数が複数存在し下記関数が衝突する
    // ERC721とERC721Enumerableでの _beforeTokenTransfer 関数。
    // ERC2771ContextとContextでの _msgData 関数。
    // ERC2771ContextとContextでの _msgSender 関数。
    // AccessControl、ERC721、ERC721Enumerableでの supportsInterface 関数。
    // IkmzERC721 コントラクトでこれらの関数を明示的にオーバーライドし、適切な基本コントラクトから関数を呼び出して、意図した機能を維持する
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId
    )
        internal
        virtual
        override(
            // uint256 batchSize
            ERC721,
            ERC721Enumerable
        )
    {
        super._beforeTokenTransfer(from, to, firstTokenId);
    }

    function _msgData()
        internal
        view
        override(ERC2771Context, Context)
        returns (bytes calldata)
    {
        return ERC2771Context._msgData();
    }

    function _msgSender()
        internal
        view
        override(ERC2771Context, Context)
        returns (address sender)
    {
        return ERC2771Context._msgSender();
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
