// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC721, Context} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract GasOfNFTBulkMint is
    ERC721,
    ERC721Enumerable,
    AccessControl,
    ERC2771Context
{
    using Counters for Counters.Counter;
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    Counters.Counter private _tokenIdTracker;

    string private _baseTokenURI;

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
        _setupRole(EXECUTOR_ROLE, admin);
    }

    // bulk mint - require once
    function Mint_RequireOnce(address _to) public {
        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "GasOfNFTBulkMint: must have minter role to mint"
        );
        _mintNFT(_to);
    }

    function BulkMint_RequireOnce(address[] calldata _tos) public {
        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "GasOfNFTBulkMint: must have minter role to mint"
        );

        for (uint256 i = 0; i < _tos.length; i++) {
            _mintNFT(_tos[i]);
        }
    }

    function _mintNFT(address _to) internal {
        uint256 tokenId = _tokenIdTracker.current();
        _mint(_to, tokenId);
        _tokenIdTracker.increment();
    }

    // bulk mint - require again
    function Mint_RequireAgain(address _to) public {
        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "GasOfNFTBulkMint: must have minter role to mint"
        );

        uint256 tokenId = _tokenIdTracker.current();
        _mint(_to, tokenId);
        _tokenIdTracker.increment();
    }

    function BulkMint_RequireAgain(address[] calldata _tos) public {
        for (uint256 i = 0; i < _tos.length; i++) {
            Mint_RequireAgain(_tos[i]);
        }
    }

    // override
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
