// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// https://zenn.dev/microverse_dev/articles/how-to-allowlist-mint#contract-%E3%81%AE%E5%AE%9F%E8%A3%85
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract IkmzMerkleProof is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdTracker;

    string private _baseTokenURI;

    constructor(
      string memory name,
      string memory symbol
    ) ERC721(name, symbol) {
      _tokenIdTracker.increment();
    }

    function mint(address _to) public payable returns (uint256) {
        uint256 tokenId = _tokenIdTracker.current();
        _mint(_to, tokenId);
        _tokenIdTracker.increment();
        return tokenId;
    }
}