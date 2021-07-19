// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/interfaces/IUniswapV2Router02.sol";


contract UniswapSwapper {
    address internal constant ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D ;
    IUniswapV2Router02 public uniswapRouter;
    
    constructor() {
        uniswapRouter = IUniswapV2Router02(ROUTER_ADDRESS);
    }
    
    // @TODO: Can't approve the transference using delegatecall. Will generate the transactions on FE for Metamask
    function batchSwap(address[] memory tokensAddresses, uint256[] memory amountIn, uint256[] memory amountOutMin, uint256 deadline) public {
        for(uint256 i = 0; i < tokensAddresses.length; i++){
            IERC20 curToken = IERC20(tokensAddresses[i]);
            (bool bswap_approval, ) = address(curToken).delegatecall(
                abi.encodeWithSignature("approve(address,uint256)", this, amountIn[i])
            );            
            require(bswap_approval, 'BatchSwap approve failed.');
            require(curToken.transferFrom(msg.sender, address(this), amountIn[i]), 'transferFrom failed.');
            (bool router_approval, ) = address(curToken).delegatecall(
                abi.encodeWithSignature("approve(address,uint256)", ROUTER_ADDRESS, amountIn[i])
            );            
            require(router_approval, 'Router approve failed.');
            uniswapRouter.swapExactTokensForETH(amountIn[i], amountOutMin[i], _getPathForTokentoETH(tokensAddresses[i]), msg.sender, deadline);
        }
    }
    
    function _getPathForTokentoETH(address tokenAddress) private view returns (address[] memory){
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = uniswapRouter.WETH();
        return path;
    }
    
}