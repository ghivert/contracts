//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';
import 'hardhat/console.sol';
import './Wei.sol';

contract Booking is ERC721Enumerable, AccessControl {
  using Counters for Counters.Counter;

  bytes32 public constant OPENER_ROLE = keccak256('OPENER_ROLE');
  bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');

  Counters.Counter private _counter;
  uint256 private _remainingPlaces;
  uint256 private _placePrice;
  AggregatorV3Interface private _priceEthUsdFeed;
  AggregatorV3Interface private _priceEurUsdFeed;

  event NewPlacesAdded(uint256 count);
  event PlaceBought(address user);
  event PlaceUsed(address user, uint256 tokenId);
  event Withdrawed(uint256 withdrawed);

  constructor(address priceEthUsdFeed, address priceEurUsdFeed)
  ERC721('Crypto Comedy Club #2', 'CCC2') {
    _priceEthUsdFeed = AggregatorV3Interface(priceEthUsdFeed);
    _priceEurUsdFeed = AggregatorV3Interface(priceEurUsdFeed);
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(ADMIN_ROLE, msg.sender);
    _remainingPlaces = 30;
    _placePrice = 795; // Divide by 100 to get the price in €. It is in cents.
  }

  function updatePlacePrice(
    uint256 placePrice
  ) external onlyRole(ADMIN_ROLE) returns (bool) {
    _placePrice = placePrice;
    return true;
  }

  function deletePlace(
    address user,
    uint256 tokenId
  ) external onlyRole(OPENER_ROLE) returns (bool) {
    require(ownerOf(tokenId) == user, 'Place doesnt belong to user');
    _burn(tokenId);
    emit PlaceUsed(user, tokenId);
    return true;
  }

  function removePlaces(uint256 count) external onlyRole(ADMIN_ROLE) returns (bool) {
    _remainingPlaces = _remainingPlaces - count;
    if (_remainingPlaces < 0) _remainingPlaces = 0;
    return true;
  }

  function addPlaces(uint256 count) external onlyRole(ADMIN_ROLE) returns (bool) {
    _remainingPlaces = _remainingPlaces + count;
    emit NewPlacesAdded(count);
    return true;
  }

  function withdrawal() external onlyRole(ADMIN_ROLE) {
    uint256 balance = address(this).balance;
    // solhint-disable-next-line
    (bool success, ) = msg.sender.call{value: balance}('');
    require(success, 'Transfer failed');
    emit Withdrawed(balance);
  }

  function availablePlaces() external view returns (uint256) {
    return _remainingPlaces;
  }

  // Here because of the overriding.
  function supportsInterface(bytes4 interfaceId) public view virtual
    override(ERC721Enumerable, AccessControl) returns (bool) {
      return super.supportsInterface(interfaceId);
  }

  function book(uint256 count) public payable returns (uint256[] memory) {
    require(_remainingPlaces >= count, 'No remaining places');
    int256 value = int256(msg.value);
    int256 priceAsWei = Wei.fromFeed(_priceEthUsdFeed, _priceEurUsdFeed, _placePrice);
    int256 finalPrice = priceAsWei * int256(count);
    require(value >= finalPrice, 'Not enough money');
    uint256[] memory ids = new uint256[](count);
    for (uint256 i = 0; i < count; i++) {
      _counter.increment();
      uint256 id = _counter.current();
      _safeMint(msg.sender, id);
      _remainingPlaces = _remainingPlaces - 1;
      emit PlaceBought(msg.sender);
      ids[i] = id;
    }
    return ids;
  }

  function _baseURI() internal view virtual override(ERC721) returns (string memory) {
    return 'https://cryptocomedyclub.co/.netlify/functions/tokenURI/';
  }
}
