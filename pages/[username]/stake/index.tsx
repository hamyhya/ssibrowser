import Layout from '../../../components/Layout'
import { DIDDocument, Headline, Stake } from '../../../components'
import styles from '../../styles.module.scss'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { GetStaticPaths } from 'next/types'
import { useTranslation } from 'next-i18next'

function StakeIndex() {
    const { t } = useTranslation()
    const data = [
        {
            name: 'web3wallet',
            router: '',
        },
    ]

    return (
        <>
            <Layout>
                <div className={styles.headlineWrapper}>
                    <Headline data={data} />
                </div>
                <Stake />
            </Layout>
        </>
    )
}

export const getStaticPaths: GetStaticPaths<{ slug: string }> = async () => {
    return {
        paths: [],
        fallback: 'blocking',
    }
}

export const getStaticProps = async ({ locale }) => ({
    props: {
        ...(await serverSideTranslations(locale, ['common'])),
    },
})

export default StakeIndex