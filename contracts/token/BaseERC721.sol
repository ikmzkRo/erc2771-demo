// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9; // compiler version

// ERC721規格にない設定をOZから継承します
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract BaseERC721 is ERC721Enumerable, ERC721URIStorage, Ownable {
    constructor() ERC721("BaseERC721Name", "BaseERC721Symbol") {} // name, symbol

    /**
     * @dev
     * _tokenIdsはCountersの全関数が利用可能
     */
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    /**
     * @dev
     * 誰に対して、どのtokenId、どのtokenUrlでNFTをmintしたかを記録するイベントを定義
     * eventを定義して特定の処理の中でemitしてイベントを発行する
     */
    event TokenURIChanged(
        address indexed to,
        uint256 indexed tokenId,
        string uri
    );

    /**
     * @dev
     * memory = 変更可能な変数, calldata = 変更不可能な変数
     * external = このスマコン内部からは呼び出せない
     * onlyOwner = このスマコンをデプロイしたアドレスだけがこの関数を実行できる
     * emit = コントラクト側でイベントをemitするとフロントエンドでそのイベント通知を受け取ることができる
     */
    function nftMint(address to, string calldata uri) external onlyOwner {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(to, newTokenId);

        // 作成したトークンIDに対してメタデータを紐づける処理
        _setTokenURI(newTokenId, uri);

        emit TokenURIChanged(to, newTokenId, uri);
    }

    /**
     * @dev
     * openzeppelinのメソッドを継承する場合は関数名が被らないように対応する
     * 継承元の関数を下記のように貼り付けて上書きする作業のことをオーバーライドと呼びます
     * virtual = 上書き可能フラグが正
     * super = エラー対応のみで、内部処理を変えたくない場合
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev
     */
    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * @dev
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
