import React, { useEffect, useState } from 'react'
import * as PropTypes from "prop-types";
import { Col, Row, SvgIcon } from "../../../components/common";
import './index.scss';
import { connect } from "react-redux";
import { Button, List, message, Modal, Table, Tabs } from "antd";
import { denomToSymbol, iconNameFromDenom, symbolToDenom } from "../../../utils/string";
import { amountConversion, amountConversionWithComma } from '../../../utils/coin';
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE, DOLLAR_DECIMALS, PRODUCT_ID } from '../../../constants/common';
import { totalVTokens, userProposalAllUpData, userProposalAllUpPoolData, userProposalProjectedEmission, votingCurrentProposal, votingCurrentProposalId, votingTotalBribs, votingTotalVotes, votingUserVote } from '../../../services/voteContractsRead';
import { queryAssets, queryPair, queryPairVault } from '../../../services/asset/query';
import { queryMintedTokenSpecificVaultType, queryOwnerVaults, queryOwnerVaultsInfo, queryUserVaults } from '../../../services/vault/query';
import { transactionForVotePairProposal } from '../../../services/voteContractsWrites';
import { setBalanceRefresh } from "../../../actions/account";
import { Link } from 'react-router-dom';
import moment from 'moment';
import TooltipIcon from '../../../components/TooltipIcon';
import Snack from '../../../components/common/Snack';
import variables from '../../../utils/variables';
import { comdex } from '../../../config/network';
import NoDataIcon from '../../../components/common/NoDataIcon';
import CustomSkelton from '../../../components/CustomSkelton';
import { MyTimer } from '../../../components/TimerForAirdrop'
import Pool from './pool';
import { queryFarmedPoolCoin, queryFarmer, queryPoolsList } from '../../../services/pools/query';
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { formatNumber } from '../../../utils/number';
import { fetchRestPrices } from '../../../services/oracle/query';
import ViewAllToolTip from './viewAllModal';

const Vote = ({
  lang,
  address,
  refreshBalance,
  setBalanceRefresh,
  assetMap,
}) => {
  const [loading, setLoading] = useState(false);
  const [inProcess, setInProcess] = useState(false);
  const [proposalId, setProposalId] = useState();
  const [proposalExtenderPair, setProposalExtenderPair] = useState();
  const [currentProposalAllData, setCurrentProposalAllData] = useState();
  const [disableVoteBtn, setVoteDisableBtn] = useState(true)
  const [allProposalData, setAllProposalData] = useState();
  const [allProposalPoolData, setAllProposalPoolData] = useState();
  const [btnLoading, setBtnLoading] = useState(0);
  const [pairVaultData, setPairValutData] = useState({})
  const [assetList, setAssetList] = useState();
  const [pairIdData, setPairIdData] = useState({});
  const [totalBorrowed, setTotalBorrowed] = useState({});
  const [vaultId, setVaultId] = useState({});
  const [myBorrowed, setMyBorrowed] = useState({});

  const [totalVotingPower, setTotalVotingPower] = useState(0);
  const [isViewAllModalVisible, setIsViewAllModalVisible] = useState(false);
  const [protectedEmission, setProtectedEmission] = useState(0);
  const [poolList, setPoolList] = useState();
  const [concatedExtendedPair, setConcatedExtendedPair] = useState([]);
  const [cswapPrice, setCswapPrice] = useState([])
  const [userPoolFarmedData, setUserPoolFarmedData] = useState({})
  const [totalPoolFarmedData, setTotalPoolFarmedData] = useState({})



  // Query 
  const fetchVotingCurrentProposalId = () => {
    setLoading(true)
    votingCurrentProposalId(PRODUCT_ID).then((res) => {
      setProposalId(res)
      setLoading(false)
    }).catch((error) => {
      setLoading(false)
      console.log(error);
    })
  }

  const fetchVotingCurrentProposal = (proposalId) => {
    votingCurrentProposal(proposalId).then((res) => {
      setProposalExtenderPair(res?.extended_pair)
      setCurrentProposalAllData(res)
    }).catch((error) => {
      console.log(error);
    })
  }

  const fetchuserProposalProjectedEmission = (proposalId) => {
    userProposalProjectedEmission(proposalId).then((res) => {
      setProtectedEmission(amountConversion(res))
    }).catch((error) => {
      console.log(error);
    })
  }

  const unixToUTCTime = (time) => {
    // *Removing miliSec from unix time 
    let newTime = Math.floor(time / 1000000000);
    var timestamp = moment.unix(newTime);
    timestamp = moment.utc(timestamp).format("dddd DD-MMMM-YYYY [at] HH:mm:ss [UTC]")
    return timestamp;
  }

  const getProposalTimeExpiredOrNot = () => {
    let endTime = currentProposalAllData?.voting_end_time;
    // *Removing miliSec from unix time 
    let newEndTime = Math.floor(endTime / 1000000000);
    let currentTime = moment().unix();
    if (currentTime > newEndTime) {
      return setVoteDisableBtn(true)
    }
    else {
      return setVoteDisableBtn(false)
    }
  }

  const calculteVotingTime = () => {
    let endDate = currentProposalAllData?.voting_end_time;
    endDate = unixToUTCTime(endDate);
    if (endDate === "Invalid date") {
      return "Loading... "
    }
    return endDate;
  }

  const votingStart = () => {
    let startDate = currentProposalAllData?.voting_start_time;
    // *Removing miliSec from unix time 
    let newTime = Math.floor(startDate / 1000000000);
    var timestamp = moment.unix(newTime);
    timestamp = moment.utc(timestamp).format("YYYY-MM-DD HH:mm:ss [UTC]")
    if (timestamp === "Invalid date") {
      return "0000-00-00 00:00:00 UTC"
    }
    return timestamp;
  }

  const votingEnd = () => {
    let endDate = currentProposalAllData?.voting_end_time;
    // *Removing miliSec from unix time 
    let newTime = Math.floor(endDate / 1000000000);
    var timestamp = moment.unix(newTime);
    timestamp = moment.utc(timestamp).format("YYYY-MM-DD HH:mm:ss [UTC]")
    if (timestamp === "Invalid date") {
      return "0000-00-00 00:00:00 UTC"
    }
    return timestamp;
  }

  const calculteVotingStartTime = () => {
    let startDate = currentProposalAllData?.voting_start_time;
    startDate = unixToUTCTime(startDate);
    if (startDate === "Invalid date") {
      return ""
    }
    return startDate;
  }

  const fetchAssets = (offset, limit, countTotal, reverse) => {
    queryAssets(offset, limit, countTotal, reverse, (error, data) => {
      if (error) {
        message.error(error);
        return;
      }
      setAssetList(data.assets)
    });
  };

  const fetchQueryPairValut = (extendedPairId) => {
    queryPairVault(extendedPairId, (error, data) => {
      if (error) {
        message.error(error);
        return;
      }
      setPairIdData((prevState) => ({
        ...prevState, [extendedPairId]: data?.pairVault?.pairId?.toNumber()
      }))
      setPairValutData((prevState) => ({
        ...prevState, [extendedPairId]: data?.pairVault?.pairName
      }))
    })
  }

  const fetchtotalBorrowed = (productId, extendedPairId) => {
    queryMintedTokenSpecificVaultType(productId, extendedPairId, (error, data) => {
      if (error) {
        message.error(error);
        return;
      }
      setTotalBorrowed((prevState) => ({
        ...prevState, [extendedPairId]: data?.tokenMinted
      }))
    })
  }

  const getOwnerVaultId = (productId, address, extentedPairId) => {
    queryOwnerVaults(productId, address, extentedPairId, (error, data) => {
      if (error) {
        message.error(error);
        return;
      }
      setVaultId((prevState) => ({
        ...prevState, [extentedPairId]: data?.vaultId?.toNumber()
      }))
    })
  }

  const getOwnerVaultInfoByVaultId = (ownerVaultId) => {
    queryOwnerVaultsInfo(ownerVaultId, (error, data) => {
      if (error) {
        message.error(error);
        return;
      }
      setMyBorrowed((prevData) => ({
        ...prevData, [data?.vault?.extendedPairVaultId?.toNumber()]: data?.vault?.amountOut
      }))
    })
  }

  const fetchTotalVTokens = (address, height) => {
    totalVTokens(address, height).then((res) => {
      setTotalVotingPower(res)
    }).catch((error) => {
      console.log(error);
    })
  }

  const getIconFromPairName = (extendexPairVaultPairName) => {
    let pairName = extendexPairVaultPairName;
    pairName = pairName?.replace(/\s+/g, ' ').trim()
    if (!pairName?.includes("-")) {
      return pairName?.toLowerCase();
    } else {
      pairName = pairName?.slice(0, -2);
      pairName = pairName?.toLowerCase()
      return pairName;
    }
  }

  const calculateTotalVotes = (value) => {
    let userTotalVotes = 0;
    let calculatePercentage = 0;

    calculatePercentage = (Number(value) / amountConversion(currentProposalAllData?.total_voted_weight || 0, DOLLAR_DECIMALS)) * 100;
    calculatePercentage = Number(calculatePercentage || 0).toFixed(DOLLAR_DECIMALS)
    return calculatePercentage;
  }

  useEffect(() => {
    fetchVotingCurrentProposalId()
    if (proposalId) {
      fetchVotingCurrentProposal(proposalId)
    } else {
      setProposalExtenderPair("")
    }
  }, [address, proposalId, refreshBalance])

  const getPairFromExtendedPair = () => {
    allProposalData && allProposalData.map((item) => {
      fetchQueryPairValut(item?.extended_pair_id)
      getOwnerVaultId(PRODUCT_ID, address, item?.extended_pair_id)
      fetchtotalBorrowed(PRODUCT_ID, item?.extended_pair_id)
    })
  }

  const fetchProposalAllUpData = (address, proposalId) => {
    setLoading(true)
    userProposalAllUpData(address, proposalId,).then((res) => {
      setAllProposalData(res?.proposal_pair_data)
      setLoading(false)
    }).catch((error) => {
      setLoading(false)
      console.log(error);
    })
  };


  // *For pools 
  const fetchProposalAllUpPoolData = (address, proposalId) => {
    setLoading(true)
    userProposalAllUpPoolData(address, proposalId,).then((res) => {
      setAllProposalPoolData(res?.proposal_pair_data)
      setLoading(false)
    }).catch((error) => {
      setLoading(false)
      console.log(error);
    })
  };

  const fetchPoolLists = () => {
    queryPoolsList((error, data) => {
      if (error) {
        message.error(error);
        return;
      }
      setPoolList(data?.pools)
    })
  }

  const fetchFarmer = (poolId, address, extendexPairId) => {
    queryFarmer(poolId, address, (error, data) => {
      if (error) {
        message.error(error);
        return;
      }
      setUserPoolFarmedData((prevData) => ({
        ...prevData, [extendexPairId]: data
        // ...prevData, [extendexPairId]: data?.activePoolCoin?.amount
      }))
    })
  }

  const fetchFarmedPoolCoin = (poolId, extendexPairId) => {
    queryFarmedPoolCoin(poolId, (error, data) => {
      if (error) {
        message.error(error);
        return;
      }
      setTotalPoolFarmedData((prevData) => ({
        // ...prevData, [extendexPairId]: data
        ...prevData, [extendexPairId]: data?.coin?.amount
      }))
    })
  }

  const getPoolId = (value) => {
    let extendedPairId = value;
    let divisor = 10 ** comdex?.coinDecimals
    let result = extendedPairId % divisor;
    return result;
  }

  const getUserFarmData = (address) => {
    allProposalPoolData?.map((item) => {
      fetchFarmer(getPoolId(item?.extended_pair_id), address, item?.extended_pair_id)
      fetchFarmedPoolCoin(getPoolId(item?.extended_pair_id), item?.extended_pair_id)
    })
  }

  useEffect(() => {
    getUserFarmData(address)
  }, [allProposalPoolData, address])

  useEffect(() => {
    proposalExtenderPair && proposalExtenderPair.map((item) => {
      getOwnerVaultInfoByVaultId(vaultId[item])
    })
  }, [vaultId, refreshBalance])

  useEffect(() => {
    if (proposalId) {
      fetchProposalAllUpData(address, proposalId);
      fetchuserProposalProjectedEmission(proposalId)
      fetchProposalAllUpPoolData(address, proposalId)
    }
  }, [address, proposalId, refreshBalance])


  const handleVote = (item, index) => {
    setInProcess(true)
    setBtnLoading(index)
    if (address) {
      if (proposalId) {
        if (amountConversion(totalVotingPower, DOLLAR_DECIMALS) === Number(0).toFixed(DOLLAR_DECIMALS)) {
          message.error("Insufficient Voting Power")
          setInProcess(false)
        }
        else {
          transactionForVotePairProposal(address, PRODUCT_ID, proposalId, item, (error, result) => {
            if (error) {
              message.error(error?.rawLog || "Transaction Failed")
              setInProcess(false)
              return;
            }
            message.success(
              < Snack
                message={variables[lang].tx_success}
                explorerUrlToTx={comdex?.explorerUrlToTx}
                hash={result?.transactionHash}
              />
            )
            setBalanceRefresh(refreshBalance + 1);
            setInProcess(false)
          })

        }
      } else {
        setInProcess(false)
        message.error("Please enter amount")
      }
    }
    else {
      setInProcess(false)
      message.error("Please Connect Wallet")
    }
  }

  useEffect(() => {
    if (currentProposalAllData) {
      fetchTotalVTokens(address, currentProposalAllData?.height)
      getProposalTimeExpiredOrNot()
    }
  }, [address, refreshBalance, currentProposalAllData])

  useEffect(() => {
    fetchAssets(
      (DEFAULT_PAGE_NUMBER - 1) * (DEFAULT_PAGE_SIZE * 2),
      (DEFAULT_PAGE_SIZE * 2),
      true,
      false
    );
    fetchPoolLists()
    fetchRestPrices((error, result) => {
      if (error) {
        console.log(error, "Price Error");
      }
      setCswapPrice(result)
    })
  }, [])

  useEffect(() => {
    getPairFromExtendedPair()
  }, [allProposalData, refreshBalance])


  const handleViewAllOk = () => {
    setIsViewAllModalVisible(false);
  };

  const showViewAll = () => {
    setIsViewAllModalVisible(true);
  };

  const handleViewAllCancel = () => {
    setIsViewAllModalVisible(false);
  };

  const columns = [
    {
      title: (
        <>
          Vault Pair
        </>
      ),
      dataIndex: "asset",
      key: "asset",
      width: 150,
    },
    {
      title: (
        <>
          My Borrowed{" "}
        </>
      ),
      dataIndex: "my_borrowed",
      key: "my_borrowed",
      width: 150,
    },
    // {
    //   title: (
    //     <>
    //       Total Borrowed
    //     </>
    //   ),
    //   dataIndex: "total_borrowed",
    //   key: "total_borrowed",
    //   width: 200,
    // },
    {
      title: (
        <>
          Total Votes
        </>
      ),
      dataIndex: "total_votes",
      key: "total_votes",
      width: 200,
    },

    {
      title: (
        <>
          External Incentives
        </>
      ),
      dataIndex: "bribe",
      key: "bribe",
      width: 200,
      render: (item) => (
        <>
          {item?.length > 0 ?
            (item?.length == 1) ?
              <div className="bribe-container mt-1" >
                <span className="assets-withicon">
                  <span className="assets-icon">
                    <SvgIcon
                      name={iconNameFromDenom(item[0]?.denom)}
                    />
                  </span>
                </span>
                <span>{amountConversionWithComma(item[0]?.amount, DOLLAR_DECIMALS)} {denomToSymbol(item[0]?.denom)} </span>

              </div>
              : (
                <div className="bribe-container mt-1" >
                  <span className="assets-withicon">
                    <span className="assets-icon">
                      <SvgIcon
                        name={iconNameFromDenom(item[0]?.denom)}
                      />
                    </span>
                  </span>
                  <span>{amountConversionWithComma(item[0]?.amount, DOLLAR_DECIMALS)} {denomToSymbol(item[0]?.denom)} </span>
                  <span> <ViewAllToolTip btnText={"View All"} bribes={item} /></span>
                </div>
              )
            : <div className="mt-1" >0</div>
          }

        </>
      ),
    },
    {
      title: (
        <>
          My Vote
        </>
      ),
      dataIndex: "my_vote",
      key: "my_vote",
      align: "center",
      width: 100,
    },
    {
      title: (
        <>
          Action
        </>
      ),
      dataIndex: "action",
      key: "action",
      align: "centre",
      width: 130,
    },
  ];

  const data = [
    {
      title: "Voting Starts",
      counts: `${votingStart()}`
    },

    {
      title: "Your Emission",
      counts: "05 HARBOR"
    },
    {
      title: "Voting Ends",
      counts: `${votingEnd()}`
    },
    {
      title: `Week ${proposalId} Total Emission`,
      counts: `${formatNumber(protectedEmission || 0)} HARBOR`
    },
  ];

  const tableData =
    allProposalData && allProposalData.map((item, index) => {
      return {
        key: index,
        asset: (
          <>
            <div className="assets-withicon">
              <div className="assets-icon">
                <SvgIcon
                  name={iconNameFromDenom(
                    symbolToDenom(getIconFromPairName(pairVaultData[item?.extended_pair_id]))
                  )}
                />
              </div>
              {pairVaultData[item?.extended_pair_id]}
            </div>
          </>
        ),
        my_borrowed: (
          <>
            <div className="assets-withicon display-center">
              {myBorrowed[item?.extended_pair_id] ? amountConversionWithComma(myBorrowed[item?.extended_pair_id], DOLLAR_DECIMALS) : Number(0).toFixed(2)}
              {" "}{denomToSymbol("ucmst")}
            </div>
          </>
        ),
        total_borrowed:
          <div>
            {totalBorrowed[item?.extended_pair_id] ? amountConversionWithComma(
              totalBorrowed[item?.extended_pair_id], DOLLAR_DECIMALS
            ) : Number(0).toFixed(2)} {denomToSymbol("ucmst")}
          </div>,
        total_votes: <div >{item?.total_vote ? amountConversionWithComma(item?.total_vote, DOLLAR_DECIMALS) : Number(0).toFixed(DOLLAR_DECIMALS)} veHARBOR <div style={{ fontSize: "12px" }}>{item?.total_vote ? calculateTotalVotes(amountConversion(item?.total_vote || 0, 6) || 0) : Number(0).toFixed(DOLLAR_DECIMALS)}%</div></div>,
        bribe: item?.bribe,
        my_vote: <div>{item?.my_vote ? amountConversion(item?.my_vote, DOLLAR_DECIMALS) : Number(0).toFixed(DOLLAR_DECIMALS)} veHARBOR</div>,
        action: <>
          <Button
            type="primary"
            className="btn-filled"
            size="sm"
            loading={index === btnLoading ? inProcess : false}
            onClick={() => handleVote(item?.extended_pair_id, index)}
            disabled={disableVoteBtn}
          >
            Vote
          </Button>
        </>,
      }
    })

  const poolColumns = [
    {
      title: (
        <>
          Vault Pair
        </>
      ),
      dataIndex: "asset",
      key: "asset",
      width: 150,
    },
    {
      title: (
        <>
          My Borrowed{" "}
        </>
      ),
      dataIndex: "my_borrowed",
      key: "my_borrowed",
      width: 150,
    },
    {
      title: (
        <>
          Total Borrowed
        </>
      ),
      dataIndex: "total_borrowed",
      key: "total_borrowed",
      width: 200,
    },
    {
      title: (
        <>
          Total Votes
        </>
      ),
      dataIndex: "total_votes",
      key: "total_votes",
      width: 200,
    },

    {
      title: (
        <>
          External Incentives
        </>
      ),
      dataIndex: "bribe",
      key: "bribe",
      width: 200,
      render: (item) => (
        <>
          {item?.length > 0 ?
            item && item?.map((singleBribe, index) => {
              return <div className="endtime-badge mt-1" key={index}>{amountConversionWithComma(singleBribe?.amount, DOLLAR_DECIMALS)} {denomToSymbol(singleBribe?.denom)}</div>
            })
            : <div className="endtime-badge mt-1" >{"       "}</div>

          }

        </>
      ),
    },
    {
      title: (
        <>
          My Vote
        </>
      ),
      dataIndex: "my_vote",
      key: "my_vote",
      align: "center",
      width: 100,
    },
    {
      title: (
        <>
          Action
        </>
      ),
      dataIndex: "action",
      key: "action",
      align: "centre",
      width: 130,
    },
  ];


  const upPoolTableData =
    allProposalPoolData && allProposalPoolData.map((item, index) => {
      return {
        key: index,
        asset_color: <>
          <div className="asset_color"></div>
        </>,
        pools: (
          <>
            <div className="assets-withicon">
              <div className="assets-icon">
                <SvgIcon
                  name={iconNameFromDenom(poolList && poolList[index]?.balances?.baseCoin?.denom)}
                />
              </div>
              <div className="assets-icon" style={{ marginLeft: "-22px" }}>
                <SvgIcon
                  name={iconNameFromDenom(poolList && poolList[index]?.balances?.quoteCoin?.denom)}
                />
              </div>
              {denomToSymbol(poolList && poolList[index]?.balances?.baseCoin?.denom)} - {denomToSymbol(poolList && poolList[index]?.balances?.quoteCoin?.denom)}
            </div>
          </>
        ),
        amount:
          <div >
            <div>{item?.total_vote ? calculateTotalVotes(amountConversion(item?.total_vote || 0, 6) || 0) : Number(0).toFixed(DOLLAR_DECIMALS)}% (<span>{(item?.total_vote ? formatNumber(calculateTotalVotes(amountConversion(item?.total_vote || 0, 6) || 0) * protectedEmission) : Number(0).toFixed(DOLLAR_DECIMALS))} HARBOR</span>) </div>
          </div>,
      }
    })

  const tabsItem = [
    {
      label: "Vaults", key: "1", children: (
        <Row>
          <Col>
            <div className="composite-card ">
              <div className="card-content">
                <Table
                  className="custom-table liquidation-table"
                  dataSource={tableData}
                  columns={columns}
                  loading={loading}
                  pagination={false}
                  scroll={{ x: "100%" }}
                  locale={{ emptyText: <NoDataIcon /> }}
                />
              </div>
            </div>

          </Col>
        </Row>
      )
    },
    {
      label: "Pools", key: "2", children: <Pool cswapPrice={cswapPrice} assetMap={assetMap} />
    },
  ]


  const PieChart1 = {
    chart: {
      type: "pie",
      backgroundColor: null,
      height: 150,
      margin: 5,
      style: {
        fontFamily: 'Montserrat'
      }
    },
    credits: {
      enabled: false,
    },
    title: {
      text: null,
    },
    plotOptions: {
      pie: {
        showInLegend: false,
        size: "110%",
        borderWidth: 0,
        innerSize: "65%",
        className: "pie-chart",
        dataLabels: {
          enabled: false,
          distance: -14,
          style: {
            fontsize: 50,
          },
        },
      },
    },
    // tooltip: {
    //   className: 'chart-tooltip',
    //   useHTML: true,
    //   padding: 0,
    //   backgroundColor: '#DCF2FC',
    //   borderWidth: 1,
    //   borderColor: '#19C1FE',
    //   shadow: false,
    //   formatter: function () {
    //     return '<div class="chart-tooltip">' + '<b>' + this.point.name + '</b>' + '<br />' + amountConversionWithComma(this.y, DOLLAR_DECIMALS) + '</div>';
    //   }
    // },
    series: [
      {
        states: {
          hover: {
            enabled: true,
          },
        },
        name: "",
        data: [
          {
            name: "AXL-USDC",
            y: 90,
            color: "#F07167",
          },
          {
            name: "ATOM",
            y: 70,
            color: "#0081A7",
          },
          {
            name: "OSMO",
            y: 40,
            color: "#00AFB9",
          },
          {
            name: "AXL-DAI",
            y: 25,
            color: "#FDFCDC",
          },
          {
            name: "Lorem ipsum",
            y: 79,
            color: "#94D2BD",
          },
          {
            name: "Lorem ipsum",
            y: 36,
            color: "#FED9B7",
          },
        ],
      },
    ],
  };

  const upPoolColumns = [
    {
      title: (
        <>

        </>
      ),
      dataIndex: "asset_color",
      key: "asset_color",
    },
    {
      title: (
        <>
          Pools
        </>
      ),
      dataIndex: "pools",
      key: "pools",
      // width: 150,
    },
    {
      title: (
        <>
          Amount
        </>
      ),
      dataIndex: "amount",
      key: "amount",
      // width: 150,
    },
  ];



  // *vault data table row for showing pair vault in up container 
  const upVaultColumns = [
    {
      title: (
        <>

        </>
      ),
      dataIndex: "asset_color",
      key: "asset_color",
    },
    {
      title: (
        <>
          Vaults
        </>
      ),
      dataIndex: "vaults",
      key: "vaults",
      // width: 150,
    },
    {
      title: (
        <>
          Amount
        </>
      ),
      dataIndex: "amount",
      key: "amount",
      // width: 150,
    },
  ];

  // *vault data table row for showing pair vault in up container 
  const upVaultTableData =
    allProposalData && allProposalData.map((item, index) => {
      return {
        key: index,
        asset_color: <>
          <div className="asset_color"></div>
        </>,
        vaults: (
          <>
            <div className="assets-withicon">
              <div className="assets-icon">
                <SvgIcon
                  name={iconNameFromDenom(
                    symbolToDenom(getIconFromPairName(pairVaultData[item?.extended_pair_id]))
                  )}
                />
              </div>
              <div className="assets-icon" style={{ marginLeft: "-22px" }}>
                <SvgIcon
                  name={iconNameFromDenom("")}
                />
              </div>
              {pairVaultData[item?.extended_pair_id]}
            </div>
          </>
        ),
        amount: <div>{item?.total_vote ? calculateTotalVotes(amountConversion(item?.total_vote || 0, 6) || 0) : Number(0).toFixed(DOLLAR_DECIMALS)}% (<span>{(item?.total_vote ? formatNumber((calculateTotalVotes(amountConversion(item?.total_vote || 0, 6) || 0) * protectedEmission)) : Number(0).toFixed(DOLLAR_DECIMALS))} HARBOR</span>)</div>,
      }
    })

  const calculateToatalUserFarmedToken = (tokens) => {
    let activePoolCoins = Number(tokens?.activePoolCoin?.amount) || 0;
    let quedPoolCoins = 0;
    let totalUserPoolCoin = 0;
    let quedPoolCoinsArray = tokens?.queuedPoolCoin?.map((item) => {
      let amount = Number(item?.poolCoin?.amount)
      quedPoolCoins += amount;
    })
    totalUserPoolCoin = activePoolCoins + quedPoolCoins
    // return totalUserPoolCoin;
    return activePoolCoins;
  }


  // *calculate user emission 

  const calculateUserEmission = (_myBorrowed, _totalBorrowed, _totalVoteOfPair) => {
    // !formula = ((myBorrowed/TotalBorrowed) * (Total Vote of Particular Pair/total_vote_weight))*projected_emission
    let myBorrowed = _myBorrowed || 0;
    let totalBorrowed = _totalBorrowed || 0;
    let totalVoteOfPair = _totalVoteOfPair || 0;
    let totalWeight = amountConversion(currentProposalAllData?.total_voted_weight || 0, DOLLAR_DECIMALS);
    let projectedEmission = protectedEmission;
    console.log(myBorrowed, "myBorrowed");
    console.log(totalBorrowed, "totalBorrowed");
    console.log(totalVoteOfPair, "totalVoteOfPair");
    console.log(totalWeight, "toralWeight");

  }


  useEffect(() => {
    let concatedData = allProposalData?.concat(allProposalPoolData)
    setConcatedExtendedPair(concatedData)
  }, [allProposalData, allProposalPoolData])

  useEffect(() => {
    if (concatedExtendedPair) {
      concatedExtendedPair?.map((singleConcatedExtendedPair) => {
        // *if extended pair is less than 1, means it is vault extended pair else it is pool extended pair 
        if (((singleConcatedExtendedPair?.extended_pair_id) / 100000) < 1) {
          // *For vault 
          calculateUserEmission(
            amountConversionWithComma(myBorrowed[singleConcatedExtendedPair?.extended_pair_id] || 0, DOLLAR_DECIMALS),
            amountConversionWithComma(totalBorrowed[singleConcatedExtendedPair?.extended_pair_id] || 0, DOLLAR_DECIMALS),
            calculateTotalVotes(amountConversion(singleConcatedExtendedPair?.total_vote || 0, comdex?.coinDecimals))
          )
        } else {
          // *For Pool 
          calculateUserEmission(
            amountConversion(calculateToatalUserFarmedToken(userPoolFarmedData[singleConcatedExtendedPair?.extended_pair_id]) || 0, DOLLAR_DECIMALS),
            amountConversion(totalPoolFarmedData[singleConcatedExtendedPair?.extended_pair_id] || 0, DOLLAR_DECIMALS),
            calculateTotalVotes(amountConversion(singleConcatedExtendedPair?.total_vote || 0, comdex?.coinDecimals))
          )
        }


      })
    }
  }, [concatedExtendedPair, totalPoolFarmedData, userPoolFarmedData])


  return (
    <>
      <div className="app-content-wrapper">
        <Row>
          <Col>
            <div className="totol-voting-main-container mb-3">
              <div className='d-flex total-voting-power-tooltip-box'>
                <div className="total-voting-container">
                  <div className="total-veHARBOR">
                    My Voting Power : <span className='fill-box'><span>{amountConversionWithComma(totalVotingPower, DOLLAR_DECIMALS)}</span> veHARBOR</span>
                  </div>
                </div>
                <TooltipIcon text={` Voting power will be calculated as per the last voting epoch date: ${calculteVotingStartTime()}`} />
              </div>
              <div>
                <Link to="/more"><Button className="back-btn" type="primary">Back</Button></Link>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col>
            <div className="emission-card w-100" style={{ height: "100%" }}>
              <div className="card-header">
                <div className="left">
                  Emission Voting <TooltipIcon text="" />
                </div>
                <div className="right">
                  {currentProposalAllData?.voting_end_time ?
                    <span><MyTimer expiryTimestamp={currentProposalAllData && (currentProposalAllData?.voting_end_time) / 1000000} text={"Voting Ends In : "} /></span>
                    :
                    <span>Voting Ends In <b>0</b> D  <b>0</b> H <b>0</b> M </span>
                  }
                </div>
              </div>
              <List
                grid={{
                  gutter: 16,
                  xs: 1,
                  sm: 1,
                  md: 2,
                  lg: 2,
                  xl: 2,
                  xxl: 2,
                }}
                dataSource={data}
                renderItem={item => (
                  <List.Item >
                    <div>
                      <p className='emission-card-p'>{item.title}</p>
                      <h3 className="claim-drop-amount emission-card-h3">{item.counts}</h3>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </Col>


          <Col>
            <div className="emission-card w-100" style={{ height: "100%" }}>
              <div className="graph-container">
                <div className="top">
                  <div className="card-header">
                    <div className="left">
                      Vaults & Pools
                    </div>
                    <div className="right" onClick={showViewAll}>
                      View All
                    </div>
                  </div>
                </div>
                <div className="bottom">
                  <div className="bottom-left">
                    <div className="graph-container">
                      <HighchartsReact highcharts={Highcharts} options={PieChart1} />
                    </div>
                  </div>
                  <div className="bottom-right">
                    <div className="asset-container">

                      <div className="composite-card ">
                        <div className="card-content">
                          <Table
                            className="custom-table vote-up-data-table-container"
                            dataSource={upPoolTableData}
                            columns={upPoolColumns}
                            // loading={loading}
                            pagination={false}
                            scroll={{ x: "100%" }}
                            locale={{ emptyText: <NoDataIcon /> }}
                          />
                        </div>
                      </div>

                      <div className="composite-card vault-table-card">
                        <div className="card-content">
                          <Table
                            className="custom-table vote-up-data-table-container"
                            dataSource={upVaultTableData}
                            columns={upVaultColumns}
                            loading={loading}
                            pagination={false}
                            scroll={{ x: "100%" }}
                            locale={{ emptyText: <NoDataIcon /> }}
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>



            {/* View all pools and vaults  */}
            <div>
              <Modal
                centered={true}
                className="palcebid-modal reward-collect-modal"
                footer={null}
                header={null}
                open={isViewAllModalVisible}
                width={600}
                closable={true}
                onOk={handleViewAllOk}
                // loading={loading}
                onCancel={handleViewAllCancel}
              >
                <div className="palcebid-modal-inner rewards-modal-main-container">
                  <Row>
                    <Col>
                      <div className="rewards-title">
                        Vaults & Pools
                      </div>
                    </Col>
                  </Row>

                  <Row style={{ paddingTop: 0 }}>
                    <Col>

                      <div className="emission-card">
                        <div className="graph-container">
                          <div className="bottom">
                            <div className="bottom-left">
                              <div className="graph-container">
                                <HighchartsReact highcharts={Highcharts} options={PieChart1} />
                              </div>
                            </div>
                            <div className="bottom-right">
                              <div className="asset-container">

                                <div className="composite-card ">
                                  <div className="card-content">
                                    <Table
                                      className="custom-table vote-up-data-table-container"
                                      dataSource={upPoolTableData}
                                      columns={upPoolColumns}
                                      // loading={loading}
                                      pagination={false}
                                      scroll={{ x: "100%" }}
                                      locale={{ emptyText: <NoDataIcon /> }}
                                    />
                                  </div>
                                </div>

                                <div className="composite-card vault-table-card">
                                  <div className="card-content">
                                    <Table
                                      className="custom-table vote-up-data-table-container"
                                      dataSource={upVaultTableData}
                                      columns={upVaultColumns}
                                      // loading={loading}
                                      pagination={false}
                                      scroll={{ x: "100%" }}
                                      locale={{ emptyText: <NoDataIcon /> }}
                                    />
                                  </div>
                                </div>

                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </Col>
                  </Row>
                </div>
              </Modal>
            </div>



          </Col>

        </Row>


        <Row>
          <Col>
            <Tabs
              className="comdex-tabs mt-4"
              defaultActiveKey="1"
              items={tabsItem}
            />
          </Col>
        </Row>
      </div>

    </>
  )
}

Vote.propTypes = {
  lang: PropTypes.string.isRequired,
  address: PropTypes.string,
  refreshBalance: PropTypes.number.isRequired,
  assetMap: PropTypes.object,
};
const stateToProps = (state) => {
  return {
    lang: state.language,
    address: state.account.address,
    refreshBalance: state.account.refreshBalance,
    assetMap: state.asset.map,
  };

};
const actionsToProps = {
  setBalanceRefresh,
};
export default connect(stateToProps, actionsToProps)(Vote);