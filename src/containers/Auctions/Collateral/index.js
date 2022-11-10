import * as PropTypes from "prop-types";
import { Col, Row, SvgIcon } from "../../../components/common";
import { connect, useDispatch, useSelector } from "react-redux";
import { Table } from "antd";
import PlaceBidModal from "./PlaceBidModal";
import "../index.scss";
import FilterModal from "../FilterModal/FilterModal";
import { setPairs } from "../../../actions/asset";
import { setAuctions } from "../../../actions/auction";
import Bidding from "./Bidding";
import { setBalanceRefresh } from "../../../actions/account";
import { setAuctionsPageSize, setAuctionsPageNumber } from "../../../actions/auction";
import {
  queryDutchAuctionList,
  queryAuctionParams,
  queryFilterDutchAuctions,
} from "../../../services/auction";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  DOLLAR_DECIMALS,
} from "../../../constants/common";
import { message } from "antd";
import { useState, useEffect } from "react";
import {
  amountConversion,
  amountConversionWithComma,
  denomConversion,
} from "../../../utils/coin";
import moment from "moment";
import { iconNameFromDenom } from "../../../utils/string";
import { commaSeparator, decimalConversion } from "../../../utils/number";
import TooltipIcon from "../../../components/TooltipIcon";
import { comdex } from "../../../config/network";

const CollateralAuctions = ({ updateBtnLoading, setPairs, auctions, setAuctions, refreshBalance, address, assetMap, auctionsPageSize, auctionsPageNumber, setAuctionsPageSize, setAuctionsPageNumber }) => {
  const dispatch = useDispatch()
  const selectedAuctionedAsset = useSelector((state) => state.auction.selectedAuctionedAsset);

  const [inProgress, setInProgress] = useState(false);
  const [params, setParams] = useState({});


  useEffect(() => {
    queryParams();
  }, [address, refreshBalance]);


  useEffect(() => {
    setAuctionsPageSize(DEFAULT_PAGE_SIZE)
    setAuctionsPageNumber(DEFAULT_PAGE_NUMBER)
  }, [])


  useEffect(() => {
    fetchAuctions((auctionsPageNumber - 1) * auctionsPageSize, auctionsPageSize, true, true);
  }, [address, refreshBalance])

  const queryParams = () => {
    queryAuctionParams((error, result) => {
      if (error) {
        return;
      }

      setParams(result?.auctionParams);
    });
  };

  const fetchAuctions = (offset, limit, isTotal, isReverse) => {
    setInProgress(true);
    queryDutchAuctionList(
      offset,
      limit,
      isTotal,
      isReverse,
      (error, result) => {
        if (error) {
          setInProgress(false);
          message.error(error);
          return;
        }
        if (result?.auctions?.length > 0) {
          setAuctions(result && result?.auctions, result?.pagination?.total?.low);
        }
        else {
          setAuctions("");
        }
        setInProgress(false);
      }
    );
  };


  const fetchFilteredDutchAuctions = (offset, limit, countTotal, reverse, asset) => {
    queryFilterDutchAuctions(offset, limit, countTotal, reverse, asset, (error, data) => {
      if (error) {
        message.error(error);
        return;
      }
      dispatch(setAuctions(data));
    });
  };

  const columns = [
    {
      title: (
        <>
          Auctioned Asset <TooltipIcon text="Asset to be sold in the auction" />
        </>
      ),
      dataIndex: "auctioned_asset",
      key: "auctioned_asset",
      width: 150,
    },
    {
      title: (
        <>
          Bidding Asset{" "}
          <TooltipIcon text="Asset used to buy the auctioned asset" />
        </>
      ),
      dataIndex: "bridge_asset",
      key: "bridge_asset",
      width: 150,
    },
    {
      title: (
        <>
          Auctioned Quantity <TooltipIcon text="Amount of Auctioned asset being sold" />
        </>
      ),
      dataIndex: "quantity",
      key: "quantity",
      width: 200,
    },
    {
      title: (
        <>
          End Time <TooltipIcon text="Auction closing time" />
        </>
      ),
      dataIndex: "end_time",
      key: "end_time",
      width: 200,
      render: (end_time) => <div className="endtime-badge">{end_time}</div>,
    },
    {
      title: (
        <>
          Current Auction Price <TooltipIcon text="Current price of auction asset" />
        </>
      ),
      dataIndex: "current_price",
      key: "current_price",
      width: 200,
      render: (item) => (
        <>
          $
          {commaSeparator(
            Number(
              amountConversion(decimalConversion(item?.outflowTokenCurrentPrice) || 0) || 0
            ).toFixed(DOLLAR_DECIMALS)
          )}
        </>
      ),
    },
    {
      title: (
        <>
          Bid
        </>
      ),
      dataIndex: "action",
      key: "action",
      align: "right",
      width: 80,
      render: (item) => (
        <>
          <PlaceBidModal
            params={params}
            auction={item}
            discount={params?.auctionDiscountPercent}
          />
        </>
      ),
    },
  ];

  const tableData =
    auctions && auctions?.auctions?.length > 0
      ? auctions?.auctions?.map((item, index) => {
        return {
          key: index,
          id: item.id,
          auctioned_asset: (
            <>
              <div className="assets-withicon">
                <div className="assets-icon">
                  <SvgIcon
                    name={iconNameFromDenom(
                      item?.outflowTokenInitAmount?.denom
                    )}
                  />
                </div>
                {denomConversion(item?.outflowTokenInitAmount?.denom)}
              </div>
            </>
          ),
          bridge_asset: (
            <>
              <div className="assets-withicon display-center">
                <div className="assets-icon">
                  <SvgIcon
                    name={iconNameFromDenom(
                      item?.inflowTokenCurrentAmount?.denom
                    )}
                  />
                </div>
                {denomConversion(item?.inflowTokenCurrentAmount?.denom)}
              </div>
            </>
          ),
          end_time: moment(item && item.endTime).format("MMM DD, YYYY HH:mm"),
          quantity:
            <div>
              {item?.outflowTokenCurrentAmount?.amount &&
                amountConversionWithComma(
                  item?.outflowTokenCurrentAmount?.amount, comdex?.coinDecimals, assetMap[item?.outflowTokenCurrentAmount?.denom]?.decimals
                )} {denomConversion(item?.outflowTokenCurrentAmount?.denom)}
            </div>,
          current_price: item,
          action: item,
        };
      })
      : [];

  const handleChange = (value) => {
    setAuctionsPageNumber(value.current);
    setAuctionsPageSize(value.auctionsPageSize);
    fetchAuctions(
      (value.current - 1) * value.auctionsPageSize,
      value.auctionsPageSize,
      true,
      true
    );
  };

  return (
    <div className="app-content-wrapper">
      <Row>
        <Col>
          <div className={auctions?.auctions?.length > 0 ? "composite-card py-3" : "composite-card py-3 height-16"}>
            <div className="card-content">
              <Table
                className="custom-table liquidation-table"
                dataSource={tableData}
                columns={columns}
                loading={inProgress || updateBtnLoading}
                onChange={(event) => handleChange(event)}
                pagination={{
                  total:
                    auctions &&
                    auctions.pagination &&
                    auctions.pagination,
                  auctionsPageSize,
                }}
                scroll={{ x: "100%" }}
              />
            </div>
          </div>

          <div className="more-bottom mt-3">
            <h3 className="title">Bidding History</h3>
            <div className="more-bottom-card">
              <Bidding address={address} refreshBalance={refreshBalance} assetMap={assetMap} />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

CollateralAuctions.propTypes = {
  lang: PropTypes.string.isRequired,
  setPairs: PropTypes.func.isRequired,
  address: PropTypes.string,
  auctions: PropTypes.string.isRequired,
  assetMap: PropTypes.object,
  refreshBalance: PropTypes.number.isRequired,
  auctionsPageSize: PropTypes.number.isRequired,
  auctionsPageNumber: PropTypes.number.isRequired,
};

const stateToProps = (state) => {
  return {
    lang: state.language,
    address: state.account.address,
    auctions: state.auction.auctions,
    auctionsPageSize: state.auction.auctionsPageSize,
    auctionsPageNumber: state.auction.auctionsPageNumber,
    assetMap: state.asset.map,
    refreshBalance: state.account.refreshBalance,
  };
};

const actionsToProps = {
  setPairs,
  setAuctions,
  setBalanceRefresh,
  setAuctionsPageSize,
  setAuctionsPageNumber,
};

export default connect(stateToProps, actionsToProps)(CollateralAuctions);
