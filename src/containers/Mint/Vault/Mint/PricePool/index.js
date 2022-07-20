import { List, message } from "antd";
import * as PropTypes from "prop-types";
import { connect, useSelector } from "react-redux";
import {
  commaSeparator,
  decimalConversion,
  marketPrice,
} from "../../../../../utils/number";
import { amountConversion, denomConversion } from "../../../../../utils/coin";
import { DOLLAR_DECIMALS } from "../../../../../constants/common";
import { cmst, comdex } from "../../../../../config/network";
import { SvgIcon } from "../../../../../components/common";
import { denomToSymbol, iconNameFromDenom } from "../../../../../utils/string";
import { queryUserVaultsInfo } from "../../../../../services/vault/query";
import { setOwnerCurrentCollateral } from "../../../../../actions/mint";
import { useEffect } from "react";
const PricePool = ({ setOwnerCurrentCollateral, ownerVaultInfo, markets, pair, ownerCurrrentCollateral }) => {
  const selectedExtendedPairVaultListData = useSelector(
    (state) => state.locker.extenedPairVaultListData[0]
  );

  const collateralDeposited =
    Number(amountConversion(ownerVaultInfo?.amountIn)) *
    marketPrice(markets, pair?.denomIn);
  const withdrawn =
    Number(amountConversion(ownerVaultInfo?.amountOut)) *
    marketPrice(markets, pair?.denomOut);

  const collateral = Number(amountConversion(ownerVaultInfo?.amountIn || 0));
  const borrowed = Number(amountConversion(ownerVaultInfo?.amountOut || 0));

  const liquidationRatio = selectedExtendedPairVaultListData?.liquidationRatio;

  const liquidationPrice =
    decimalConversion(liquidationRatio) * (borrowed / collateral);

  useEffect(() => {
    if (ownerVaultInfo?.id) {
      getOwnerVaultInfo(ownerVaultInfo?.id)
    }
  }, [])

  const getOwnerVaultInfo = (ownerVaultId) => {
    queryUserVaultsInfo(ownerVaultId, (error, data) => {
      if (error) {
        message.error(error);
        return;
      }
      console.log(data, "data");
      let ownerCollateral = decimalConversion(data?.vaultsInfo?.collateralizationRatio) * 100
      ownerCollateral = Number(ownerCollateral).toFixed(DOLLAR_DECIMALS)
      setOwnerCurrentCollateral(ownerCollateral)
    });
  };

  const data = [
    {
      title: "Collateral Ratio",
      counts: `${ownerCurrrentCollateral}%`,
    },
    {
      title: "Collateral Deposited",
      counts: (
        <div className="collateral-deposit-main-box">
          <div className="collateral-deposit-up-box">
            {Number(ownerVaultInfo ? amountConversion(ownerVaultInfo?.amountIn) : 0).toFixed(comdex?.coinDecimals)}
            <span className="small-text">
              {denomToSymbol(pair && pair?.denomIn)}
            </span>
          </div>
          <div className="collateral-deposit-down-box">
            $
            {commaSeparator(
              Number(collateralDeposited || 0).toFixed(DOLLAR_DECIMALS)
            )}
          </div>

        </div>
      ),
    },
    {
      title: "Stability fee due",
      counts: (
        <>
          {amountConversion(ownerVaultInfo?.interestAccumulated || 0)}
          <span className="small-text">
            {denomToSymbol(pair && pair?.denomOut)}
          </span>
        </>
      ),
    },
    {
      title: "Withdrawn",
      counts: (
        <div>
          {commaSeparator(Number(withdrawn || 0).toFixed(comdex?.coinDecimals))}
          <span className="small-text">
            {denomConversion(cmst?.coinMinimalDenom)}
          </span>
        </div>
      ),
    },
  ];
  return (
    <>
      <div className="composite-card farm-content-card earn-deposite-card ">
        <div className="card-head">
          <div className="liquidation-price-container">
            <div className="svg-icon-inner">
              <SvgIcon name={iconNameFromDenom(pair && pair?.denomIn)} />
            </div>
            <span className="das"></span>
            <div className="svg-icon-inner">
              <SvgIcon name={iconNameFromDenom("ucmst")} />{" "}
            </div>

          </div>

          <div className="oracle-price-container">
            <span className="title">Oracle Price </span>{" "}
            <span className="price">
              {" "}
              $
              {commaSeparator(
                Number(marketPrice(markets, pair?.denomIn) || 0).toFixed(
                  DOLLAR_DECIMALS
                )
              )}
            </span>
          </div>
        </div>
        <List
          grid={{
            gutter: 16,
            xs: 2,
            sm: 2,
            md: 3,
            lg: 2,
            xl: 2,
            xxl: 2,
          }}
          dataSource={data}
          renderItem={(item) => (
            <List.Item>
              <div>
                <p>{item.title}</p>
                <h3>{item.counts}</h3>
              </div>
            </List.Item>
          )}
        />
      </div>
    </>
  );
};

PricePool.prototype = {
  markets: PropTypes.arrayOf(
    PropTypes.shape({
      rates: PropTypes.shape({
        high: PropTypes.number,
        low: PropTypes.number,
        unsigned: PropTypes.bool,
      }),
      symbol: PropTypes.string,
      script_id: PropTypes.string,
    })
  ),
  ownerVaultInfo: PropTypes.array,
  pair: PropTypes.shape({
    denomIn: PropTypes.string,
    denomOut: PropTypes.string,
  }),
  ownerCurrrentCollateral: PropTypes.number.isRequired,
};

const stateToProps = (state) => {
  return {
    ownerVaultInfo: state.locker.ownerVaultInfo,
    markets: state.oracle.market.list,
    pair: state.asset.pair,
    ownerCurrrentCollateral: state.mint.ownerCurrrentCollateral,
  };
};
const actionsToProps = {
  setOwnerCurrentCollateral,
};
export default connect(stateToProps, actionsToProps)(PricePool);


