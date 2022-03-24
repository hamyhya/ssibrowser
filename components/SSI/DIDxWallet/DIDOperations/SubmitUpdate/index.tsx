import * as tyron from "tyron";
import * as zcrypto from "@zilliqa-js/crypto";
import { useStore } from "effector-react";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { connect, ConnectedProps } from "react-redux";
import { Donate } from "../../../..";
import { $contract } from "../../../../../src/store/contract";
import { $donation, updateDonation } from "../../../../../src/store/donation";
import { decryptKey, operationKeyPair } from "../../../../../src/lib/dkms";
import { $arconnect } from "../../../../../src/store/arconnect";
import { $doc } from "../../../../../src/store/did-doc";
import { $net } from "../../../../../src/store/wallet-network";
import { ZilPayBase } from "../../../../ZilPay/zilpay-base";
import { $user } from "../../../../../src/store/user";
import { setTxStatusLoading, showTxStatusModal, setTxId } from "../../../../../src/app/actions"

const mapDispatchToProps = {
  dispatchLoading: setTxStatusLoading,
  dispatchShowTxStatusModal: showTxStatusModal,
  dispatchSetTxId: setTxId,
};

const connector = connect(null, mapDispatchToProps);

type ModalProps = ConnectedProps<typeof connector>;

function Component(props: ModalProps, { ids, patches }: { ids: string[], patches: tyron.DocumentModel.PatchModel[] }) {
  const { dispatchLoading, dispatchShowTxStatusModal, dispatchSetTxId } = props;
  const Router = useRouter();
  const username = useStore($user)?.name;
  const donation = useStore($donation);
  const contract = useStore($contract);
  const arConnect = useStore($arconnect);
  const dkms = useStore($doc)?.dkms;
  const net = useStore($net);

  const [txID, setTxID] = useState("");

  const handleSubmit = async () => {
    let key_input: Array<{ id: string }> = [];
    for (let i = 0; i < ids.length; i += 1) {
      key_input.push(
        {
          id: ids[i],
        },
      );
    }

    if (arConnect !== null && contract !== null && donation !== null) {
      try {
        const verification_methods: tyron.TyronZil.TransitionValue[] = [];
        const doc_elements: tyron.DocumentModel.DocumentElement[] = [];

        for (const input of key_input) {
          // Creates the cryptographic DID key pair
          const doc = await operationKeyPair({
            arConnect: arConnect,
            id: input.id,
            addr: contract.addr,
          });
          doc_elements.push(doc.element);
          verification_methods.push(doc.parameter);
        }

        const zilpay = new ZilPayBase();

        const patches_ = await tyron.Sidetree.Sidetree.processPatches(
          contract.addr,
          patches
        );
        const document = verification_methods.concat(patches_.updateDocument);
        const doc_elements_ = doc_elements.concat(patches_.documentElements);

        const hash = await tyron.DidCrud.default.HashDocument(doc_elements_);
        const encrypted_key = dkms.get("update");
        const private_key = await decryptKey(arConnect, encrypted_key);
        const public_key = zcrypto.getPubKeyFromPrivateKey(private_key);
        const signature = zcrypto.sign(
          Buffer.from(hash, "hex"),
          private_key,
          public_key
        );

        let tyron_: tyron.TyronZil.TransitionValue;
        const donation_ = String(donation * 1e12);
        switch (donation) {
          case 0:
            tyron_ = await tyron.TyronZil.default.OptionParam(
              tyron.TyronZil.Option.none,
              "Uint128"
            );
            break;
          default:
            tyron_ = await tyron.TyronZil.default.OptionParam(
              tyron.TyronZil.Option.some,
              "Uint128",
              donation_
            );
            break;
        }

        const tx_params = await tyron.TyronZil.default.CrudParams(
          contract.addr,
          document,
          await tyron.TyronZil.default.OptionParam(
            tyron.TyronZil.Option.some,
            "ByStr64",
            "0x" + signature
          ),
          tyron_
        );
        toast.info(`You're about to submit a DID Update transaction. Confirm with your DID Controller wallet.`, {
          position: "top-center",
          autoClose: 6000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'dark',
        });

        dispatchLoading(true);
        dispatchShowTxStatusModal();
        await zilpay.call({
          contractAddress: contract.addr,
          transition: "DidUpdate",
          params: tx_params as unknown as Record<string, unknown>[],
          amount: String(donation)
        })
          .then((res) => {
            dispatchSetTxId(res.ID);
            dispatchLoading(false);
            updateDonation(null);
            setTimeout(() => {
              window.open(
                `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
              );
            }, 5000);
            toast.info(`Wait for the transaction to get confirmed, and then access ${username}/did to see the changes.`, {
              position: "top-center",
              autoClose: 6000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: 'dark',
            })
            /** @todo-checked redirect to username/did */
            Router.push(`/${username}/did`)
          })
          .catch(error => { throw error })
      } catch (error) {
        toast.error(`${error}`, {
          position: "top-right",
          autoClose: 6000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'dark',
        });
      }
    }
  };

  return (
    <div>
      {
        txID === '' &&
        <Donate />
      }
      {donation !== null && (
        <div style={{ marginTop: '14%', textAlign: 'center' }}>
          <button
            type="button"
            className="button"
            onClick={handleSubmit}
          >
            <strong style={{ color: '#ffff32' }}>update did</strong>
          </button>
        </div>
      )}

      {/**
       * @todo-checked ** move to tx display modal
       */}
    </div>
  );
}

export default connect(null, mapDispatchToProps)(Component);