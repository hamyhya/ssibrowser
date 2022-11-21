import React, { useState, useRef, useEffect } from 'react'
import * as tyron from 'tyron'
import { toast } from 'react-toastify'
import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import { useStore } from 'effector-react'
import { useDispatch, useSelector } from 'react-redux'
import Image from 'next/image'
import { ZilPayBase } from '../../../../../../../../ZilPay/zilpay-base'
import { $resolvedInfo } from '../../../../../../../../../src/store/resolvedInfo'
import { $doc } from '../../../../../../../../../src/store/did-doc'
import {
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../../../../../../src/store/modal'
import {
    setTxStatusLoading,
    setTxId,
} from '../../../../../../../../../src/app/actions'
import { Donate, Selector, Spinner } from '../../../../../../../..'
import {
    $donation,
    updateDonation,
} from '../../../../../../../../../src/store/donation'
import { RootState } from '../../../../../../../../../src/app/reducers'
import { useTranslation } from 'next-i18next'
import ContinueArrow from '../../../../../../../../../src/assets/icons/continue_arrow.svg'
import TickIco from '../../../../../../../../../src/assets/icons/tick.svg'
import toastTheme from '../../../../../../../../../src/hooks/toastTheme'
import routerHook from '../../../../../../../../../src/hooks/router'
import ThreeDots from '../../../../../../../../Spinner/ThreeDots'
import smartContract from '../../../../../../../../../src/utils/smartContract'

function Component() {
    const { getSmartContract } = smartContract()
    const { navigate } = routerHook()
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const styles = isLight ? stylesLight : stylesDark

    const resolvedInfo = useStore($resolvedInfo)
    const loginInfo = useSelector((state: RootState) => state.modal)
    const doc = useStore($doc)
    const net = useSelector((state: RootState) => state.modal.net)
    const donation = useStore($donation)
    const domain = resolvedInfo?.domain

    const [nft, setNft] = useState('')
    const [selectedDomain, setSelectedDomain] = useState('')
    const [loading, setLoading] = useState(true)
    const [didDomain, setDidDomain] = useState(Array())
    const [nftList, setNftList] = useState(Array())
    const [selectedNftList, setSelectedNftList] = useState('')
    const [loadingNftList, setLoadingNftList] = useState(false)
    const [baseUri, setBaseUri] = useState('')
    const [tydra, setTydra] = useState('')
    const [tokenUri, setTokenUri] = useState(Array())

    const handleOnChangeDomain = (value) => {
        setNft('')
        updateDonation(null)
        setSelectedDomain(value)
    }

    const handleOnChangeNft = (value) => {
        setSelectedNftList('')
        setNftList([])
        updateDonation(null)
        setNft(value)
        checkTokenId(value)
    }

    const handleOnChangeNftList = (value) => {
        updateDonation(null)
        setSelectedNftList(value)
    }

    const checkTokenId = async (nft) => {
        setLoadingNftList(true)
        try {
            const init_addr = await tyron.SearchBarUtil.default.fetchAddr(
                net,
                'init',
                'did'
            )
            if (nft === 'nawelito') {
                const base_uri = await getSmartContract(init_addr, 'base_uri')
                const baseUri = base_uri.result.base_uri
                setBaseUri(baseUri)
                const get_tokenuri = await getSmartContract(
                    init_addr,
                    'token_uris'
                )
                const token_uris = await tyron.SmartUtil.default.intoMap(
                    get_tokenuri.result.token_uris
                )
                const arr = Array.from(token_uris.values())
                const domainId =
                    '0x' +
                    (await tyron.Util.default.HashString(resolvedInfo?.name!))
                let tokenUri = arr[0][domainId]
                if (!tokenUri) {
                    tokenUri = arr[1][domainId]
                }
                await fetch(`${baseUri}${tokenUri}`)
                    .then((response) => response.json())
                    .then((data) => {
                        setTydra(data.resource)
                        setSelectedNftList(tokenUri)
                    })
            } else {
                const get_services = await getSmartContract(
                    init_addr,
                    'services'
                )
                const services = await tyron.SmartUtil.default.intoMap(
                    get_services.result.services
                )
                const tokenAddr = services.get(nft)
                const base_uri = await getSmartContract(tokenAddr, 'base_uri')
                const baseUri = base_uri.result.base_uri
                setBaseUri(baseUri)
                const get_owners = await getSmartContract(
                    tokenAddr,
                    'token_owners'
                )
                const get_tokenUris = await getSmartContract(
                    tokenAddr,
                    'token_uris'
                )

                const tokenUris = get_tokenUris.result.token_uris
                const keyUris = Object.keys(tokenUris)
                const valUris = Object.values(tokenUris)
                let token_uris: any = []
                for (let i = 0; i < valUris.length; i += 1) {
                    const obj = {
                        id: keyUris[i],
                        name: valUris[i],
                    }
                    token_uris.push(obj)
                }
                console.log(token_uris)
                setTokenUri(token_uris)

                const owners = get_owners.result.token_owners
                const keyOwner = Object.keys(owners)
                const valOwner = Object.values(owners)
                let token_id: any = []
                for (let i = 0; i < valOwner.length; i += 1) {
                    if (
                        valOwner[i] === resolvedInfo?.addr ||
                        valOwner[i] === loginInfo?.zilAddr?.base16.toLowerCase()
                    ) {
                        const obj = {
                            value: keyOwner[i],
                            label: keyOwner[i],
                        }
                        token_id.push(obj)
                    }
                }
                setNftList(token_id)
            }
        } catch {
            setNftList([])
        }
        setLoadingNftList(false)
    }

    const previewNft = () => {
        if (nft === 'nawelito') {
            return (
                <img
                    className={styles.tydraImg}
                    src={`data:image/png;base64,${tydra}`}
                    alt="tydra-img"
                />
            )
        } else {
            let obj = tokenUri.find((o) => o.id === selectedNftList)
            return (
                <img
                    width={200}
                    style={{ marginTop: '20px' }}
                    src={`${baseUri}${obj.name}`}
                    alt="selected-nft"
                />
            )
        }
    }

    const fetchSubDomain = async () => {
        setLoading(true)
        try {
            const domainId =
                '0x' +
                (await tyron.Util.default.HashString(resolvedInfo?.name!))
            const addr = await tyron.SearchBarUtil.default.fetchAddr(
                net,
                domainId,
                'did'
            )
            getSmartContract(addr, 'did_domain_dns').then(async (res) => {
                const key = Object.keys(res.result.did_domain_dns)
                let arr: any = []
                for (let i = 0; i < key.length; i += 1) {
                    const obj = {
                        value: key[i],
                        label:
                            key[i] +
                            '@' +
                            resolvedInfo?.name +
                            `.${key[i] === 'did' ? 'did' : 'ssi'}`,
                    }
                    arr.push(obj)
                }
                setDidDomain(arr)
            })
        } catch {
            setDidDomain([])
        }
        setTimeout(() => {
            setLoading(false)
        }, 1000)
    }

    const handleSubmit = async () => {
        const zilpay = new ZilPayBase()
        let tx = await tyron.Init.default.transaction(net)
        let params: any = []
        const domain = {
            vname: 'domain',
            type: 'String',
            value: selectedDomain,
        }
        params.push(domain)
        const nftID = {
            vname: 'nftID',
            type: 'String',
            value: nft + '#' + selectedNftList,
        }
        params.push(nftID)
        const donation_ = await tyron.Donation.default.tyron(donation!)
        const tyron_ = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: donation_,
        }
        params.push(tyron_)

        dispatch(setTxStatusLoading('true'))
        updateModalTxMinimized(false)
        updateModalTx(true)
        await zilpay
            .call({
                contractAddress: resolvedInfo?.addr!,
                transition: 'UpdateNftDns',
                params: params as unknown as Record<string, unknown>[],
                amount: String(donation),
            })
            .then(async (res) => {
                dispatch(setTxId(res.ID))
                dispatch(setTxStatusLoading('submitted'))
                tx = await tx.confirm(res.ID)
                if (tx.isConfirmed()) {
                    dispatch(setTxStatusLoading('confirmed'))
                    setTimeout(() => {
                        window.open(
                            `https://v2.viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                        )
                    }, 1000)
                } else if (tx.isRejected()) {
                    dispatch(setTxStatusLoading('failed'))
                }
            })
            .catch((err) => {
                dispatch(setTxStatusLoading('rejected'))
                updateModalTxMinimized(false)
                updateModalTx(true)
                throw err
            })
    }

    const optionNft = [
        {
            value: 'nawelito',
            label: 'Nawelito',
        },
        {
            value: 'lexicassi',
            label: 'Lexica.art SSI NFTs',
        },
        {
            value: 'ddk10',
            label: 'DDK10',
        },
    ]

    useEffect(() => {
        fetchSubDomain()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className={styles.wrapper}>
            {loading ? (
                <Spinner />
            ) : (
                <div className={styles.contentWrapper}>
                    <div className={styles.picker}>
                        <Selector
                            option={didDomain}
                            onChange={handleOnChangeDomain}
                            placeholder="Select subdomain"
                        />
                    </div>
                    {selectedDomain !== '' && (
                        <>
                            <div className={styles.picker}>
                                <Selector
                                    option={optionNft}
                                    onChange={handleOnChangeNft}
                                    placeholder="Select NFT"
                                />
                            </div>
                            {nft !== '' && (
                                <>
                                    {loadingNftList ? (
                                        <Spinner />
                                    ) : (
                                        <>
                                            {nft !== 'nawelito' && (
                                                <>
                                                    {nftList.length > 0 ? (
                                                        <Selector
                                                            option={nftList}
                                                            onChange={
                                                                handleOnChangeNftList
                                                            }
                                                            placeholder="Select Token ID"
                                                        />
                                                    ) : (
                                                        <div>
                                                            You don&apos;t have
                                                            any NFT&apos;s in
                                                            this option
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    )}
                                    {selectedNftList !== '' && (
                                        <>
                                            {previewNft()}
                                            <Donate />
                                            {donation !== null && (
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        justifyContent:
                                                            'center',
                                                    }}
                                                >
                                                    <div
                                                        onClick={handleSubmit}
                                                        className={
                                                            isLight
                                                                ? 'actionBtnLight'
                                                                : 'actionBtn'
                                                        }
                                                    >
                                                        UPDATE NFT DNS
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default Component