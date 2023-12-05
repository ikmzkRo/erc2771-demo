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

    // デプロイ時に5件指定する
    // Trustedforwarderの登録漏れには注意する
    // TODO: isTrastedForwarder = trueで返却されることを確認する
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

    function mint(address _to) public {
        // TOOD: requreをココで呼ぶとbulkMint時のガス代に影響しないのか後で検証する
        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "IkmzERC721: must have minter role to mint" // エラー分のprefixはコントラクト名とする
        );

        // 既にミントされているメンバーかどうか判定する
        // TODO: 前述の通り、tokenOfOwnerByIndexを用いれば不要になるか・・・
        if (!hasMinted[_to]) {
            mintedMembers.push(_to);
            hasMinted[_to] = true;
        }

        uint256 tokenId = _tokenIdTracker.current();
        _mint(_to, tokenId);
        _tokenIdTracker.increment();
    }
}
