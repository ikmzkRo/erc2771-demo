// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "contracts/token/ikmz-ERC721/ERC721.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

contract IkmzERC721Factory is AccessControl {
    event FactoryCreated(
        address contractAddress,
        string name,
        string symbol,
        string baseTokenURI,
        address indexed admin
    );

    /// @dev Mapping from name and symbol to basic ERC721 address.
    mapping(string => mapping(string => address)) public getERC721ContractAddress;

    /**
     * @dev Create a new instance of IkmzERC721 contract.
     * @param _name The name of the ERC721 contract.
     * @param _symbol The symbol of the ERC721 contract.
     * @param _baseTokenURI The base URI for token metadata.
     * @param _admin The address that will have admin role in the new contract.
     * @param trustedForwarder The address of the TrustedForwarder contract for ERC2771.
     */
    function createIkmzERC721(
        string calldata _name,
        string calldata _symbol,
        string calldata _baseTokenURI,
        address _admin,
        address trustedForwarder
    ) external returns (address contractAddress) {
        require(
            getERC721ContractAddress[_name][_symbol] == address(0),
            "IkmzERC721Factory: must use another name and symbol"
        );
        IkmzERC721 newContract = new IkmzERC721(_name, _symbol, _baseTokenURI, _admin, trustedForwarder);
        contractAddress = address(newContract);

        getERC721ContractAddress[_name][_symbol] = contractAddress;
        emit FactoryCreated(contractAddress, _name, _symbol, _baseTokenURI, _admin);
    }

    /**
    * @dev Get contract address from `_name` and `_symbol`.
    * Same `_name` and `_symbol` let be override.
    */
    function getContractAddress(string calldata _name, string calldata _symbol)
        public
        view
        returns (address)
    {
        return getERC721ContractAddress[_name][_symbol];
    }
}