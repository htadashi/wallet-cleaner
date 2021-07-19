import { Button } from "react-bootstrap";

import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'

const injectedConnector = new InjectedConnector({
    supportedChainIds: [
      1, // Mainet
      3, // Ropsten
      4, // Rinkeby
      5, // Goerli
      42, // Kovan
      56, // Binance SmartChain
    ],
});
  
const Wallet = () => {
    const { account, activate, active } = useWeb3React()
  
    const onClick = () => {
      activate(injectedConnector)
    }
  
    return (
      <div>
        <div><b>Wallet address</b>: {account}</div>
        {active ? (
          <div></div>
        ) : (
          <Button onClick={onClick}>
            Connect
          </Button>
        )}
      </div>
    )
  }

export default Wallet