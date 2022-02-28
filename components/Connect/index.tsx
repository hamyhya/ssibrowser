import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import styles from "./styles.module.scss";
import { showSignInModal } from "../../src/app/actions";
import { ConnectModal } from "..";
import { $zil_address } from "../../src/store/zil_address";
import { toast } from "react-toastify";
import { useStore } from "effector-react";

const mapDispatchToProps = {
  dispatchShowModal: showSignInModal,
};

const connector = connect(undefined, mapDispatchToProps);

type Props = ConnectedProps<typeof connector>;

function SignIn(props: Props) {
  const { dispatchShowModal } = props;

  const address = useStore($zil_address);
  const handleOnClick = () => {
    dispatchShowModal();
  };

  useEffect(() => {
    if (address === null) {
      toast.info(`Connect your ZilPay wallet`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark',
      });
    }
  });

  return (
    <>
      <ConnectModal />
      <button className={styles.buttonSignIn} onClick={handleOnClick}>
        Connect
      </button>
    </>
  );
}

export default connector(SignIn);