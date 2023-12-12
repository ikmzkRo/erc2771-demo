// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// https://zenn.dev/rlho/articles/2193884e3f4b9d
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract IkmzMerkleProof is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdTracker;
    bytes32 public merkleRoot;

    constructor(
      string memory name,
      string memory symbol
    ) ERC721(name, symbol) {
      _tokenIdTracker.increment();
    }

    function mint(address _to, bytes32[] calldata _merkleProof) public payable returns (uint256) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));

        // TODO: https://github.com/OpenZeppelin/merkle-tree
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Invalid proof"
        );

        uint256 tokenId = _tokenIdTracker.current();
        _mint(_to, tokenId);
        _tokenIdTracker.increment();
        return tokenId;
    }

    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }
}