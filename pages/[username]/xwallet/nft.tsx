import Layout from "../../../components/Layout";
import { Headline, NFTUsername } from "../../../components";
import { useRouter } from "next/router";
import { updateIsController } from "../../../src/store/controller";
import { useStore } from "effector-react";
import { $user } from "../../../src/store/user";
import styles from "./styles.module.scss";

function Header() {
  const Router = useRouter();
  const username = useStore($user)?.name;
  return (
    <>
      <Layout>
        <div className={styles.headlineWrapper}>
          <Headline />
          <div style={{ textAlign: 'left' }}>
            <button
              className="button"
              onClick={() => {
                updateIsController(true);
                Router.push(`/${username}/xwallet`)
              }}
            >
              <p>wallet menu</p>
            </button>
          </div>
          <h2 style={{ color: '#ffff32', margin: '7%' }}>
            DID domains
          </h2>
        </div>
        <NFTUsername />
      </Layout>
    </>
  );
}

export default Header;
