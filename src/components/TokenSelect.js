import { useEffect, useState } from "react";
import {
  Container,
  Form,
  Row,
  Col,
  InputGroup,
  FormControl,
  Button,
  Card,
  Image,
  Spinner,
} from "react-bootstrap";
import Select from "react-select"; // https://react-select.com/home#getting-started

import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import {
  getAllERC20Balances,
  getAvailableTokens,
  estimateProfit,
} from "../services/contracts";

import Wallet from "./Wallet";
import logoImage from "../assets/logo.svg";

const TokenSelect = () => {
  const { chainId, account, active } = useWeb3React();

  const [selectedOption, setSelectedOption] = useState(null);
  const [inputSlippage, setInputSlippage] = useState("0.10");
  const [slippage, setSlippage] = useState("10");
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [options, setOptions] = useState([]);
  const [gasPrice, setGasPrice] = useState("");
  const [totalEarning, setTotalEarning] = useState(0);
  const [swapButtonText, setSwapButtonText] = useState(
    "Please connect to wallet"
  );

  useEffect(() => {
    setSelectedOption([]);
    if (active) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      getAllERC20Balances(account, chainId).then(async (ERC20balance) => {
        setLoadingPrices(true);
        const availableTokens = await getAvailableTokens(
          chainId,
          ERC20balance,
          slippage,
          provider
        );
        setOptions(availableTokens);
        setLoadingPrices(false);
      });
      switch (chainId) {
        case 1:
          setSwapButtonText("♻ Batch swap at Uniswap 🦄");
          break;
        case 56:
          setSwapButtonText("♻ Batch swap at PancakeSwap 🥞");
          break;
        default:
          setSwapButtonText("Unrecognized chain id 🙇🏻‍♂️");
          break;
      }
    }
  }, [active, account, chainId, slippage]);

  return (
    <div className="container .mx-auto .my-auto">
      <Container>
        <Row className="justify-content-md-center">
          <Col xs="5">
            <Card>
              <Card.Img variant="top" as={Image} src={logoImage} fluid={true} />
              <Card.Body>
                <Wallet />
                <p />
                <Form>
                  <Row className="align-items-center">
                    <Col xs="auto">
                      <InputGroup>
                        <InputGroup.Prepend>
                          <InputGroup.Text>
                            🍌 <b>Slippage</b>
                          </InputGroup.Text>
                        </InputGroup.Prepend>
                        <FormControl
                          id="Slippage"
                          placeholder="0.10"
                          type="number"
                          onChange={(event) => {
                            setInputSlippage(event.target.value);
                          }}
                        />
                        <InputGroup.Append>
                          <InputGroup.Text>%</InputGroup.Text>
                        </InputGroup.Append>
                      </InputGroup>
                    </Col>
                    <Col>
                      <Button
                        onClick={() => {
                          setSlippage(
                            (parseFloat(inputSlippage) * 100).toString()
                          );
                        }}
                      >
                        Update price
                      </Button>
                    </Col>
                  </Row>
                </Form>
                <br />
                <b>Select tokens to swap:</b>
                <br />
                <Select
                  value={selectedOption}
                  isMulti
                  onChange={setSelectedOption}
                  options={options}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
                {loadingPrices ? (
                  <Spinner animation="border" variant="primary" />
                ) : (
                  <div></div>
                )}
                <p />
                <Button
                  onClick={async () => {
                    const provider = new ethers.providers.Web3Provider(
                      window.ethereum
                    );
                    getAllERC20Balances(account, chainId).then(async (ERC20balance) => {
                      const profit = await estimateProfit(
                        chainId,
                        ERC20balance,
                        selectedOption,
                        slippage,
                        provider
                      );
                      setTotalEarning(profit[0]);
                      setGasPrice(profit[1]);
                    });
                  }}
                >
                  {swapButtonText}
                </Button>
                <p />
                💰 <b>Total ETH to receive:</b> {totalEarning}
                <br />⛽ <b>Estimated gas price:</b> {gasPrice}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default TokenSelect;
