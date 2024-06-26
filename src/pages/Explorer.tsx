import {
    Alert,
    AlertTitle,
    Box,
    Button,
    Collapse,
    Divider,
    IconButton,
    Paper,
    Tab,
    Tabs,
    TextField,
    Typography,
    useTheme
} from '@mui/material'
import { type CommunityTimelineSchema, Schemas, type CoreProfile } from '@concurrent-world/client'
import { useClient } from '../context/ClientContext'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Fuzzysort from 'fuzzysort'

import { CCDrawer } from '../components/ui/CCDrawer'

import { CCEditor } from '../components/ui/cceditor'
import { useSnackbar } from 'notistack'

import DoneAllIcon from '@mui/icons-material/DoneAll'
import RemoveDoneIcon from '@mui/icons-material/RemoveDone'
import { type StreamWithDomain } from '../model'
import { StreamCard } from '../components/Stream/Card'
import { SubProfileCard } from '../components/SubProfileCard'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { DomainCard } from '../components/ui/DomainCard'

export function Explorer(): JSX.Element {
    const { t } = useTranslation('', { keyPrefix: 'pages.explore' })
    const { client } = useClient()
    const theme = useTheme()
    const navigate = useNavigate()

    const { tab } = useParams()
    const path = useLocation()
    const hash = path.hash.replace('#', '')

    const [domains, setDomains] = useState<string[]>([])
    const [selectedDomains, setSelectedDomains] = useState<string[]>([client.api.host])

    const [streams, setStreams] = useState<StreamWithDomain[]>([])
    const [searchResult, setSearchResult] = useState<StreamWithDomain[]>([])
    const [search, setSearch] = useState<string>('')
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
    const [profileSchema, setProfileSchema] = useState<string>(Schemas.profile)

    const [openTips, setOpenTips] = useState<boolean>(false)

    const [characters, setProfiles] = useState<Array<CoreProfile<any>>>([])
    const [timelineDraft, setTimelineDraft] = useState<CommunityTimelineSchema>()

    const { enqueueSnackbar } = useSnackbar()

    const load = (): void => {
        client.api.getDomains().then((e) => {
            if (!client.api.host) return
            const domains = [client.host, ...e.filter((e) => e.fqdn !== client.host).map((e) => e.fqdn)]
            setDomains(domains)
        })
    }

    useEffect(() => {
        if (!hash) return
        switch (tab) {
            case 'streams':
                setSearch(hash)
                break
            case 'users':
                setProfileSchema(hash)
                break
        }
    }, [hash])

    useEffect(() => {
        if (tab !== 'streams') return
        if (selectedDomains.length === 0) {
            setStreams([])
            setSearchResult([])
            return
        }
        let unmounted = false
        Promise.all(
            selectedDomains.map(async (e) => {
                const streams = await client.getTimelinesBySchema<CommunityTimelineSchema>(e, Schemas.communityTimeline)
                return streams.map((stream) => {
                    return {
                        domain: e,
                        stream
                    }
                })
            })
        ).then((e) => {
            if (unmounted) return
            const streams = e.flat()
            setStreams(streams)
            setSearchResult(streams)
        })
        return () => {
            unmounted = true
        }
    }, [selectedDomains, tab])

    useEffect(() => {
        if (tab !== 'users') return
        if (profileSchema === '') return
        let unmounted = false
        const timer = setTimeout(() => {
            Promise.all(
                selectedDomains.map(async (e) => {
                    return (
                        ((await client.api.getProfiles({ schema: profileSchema, domain: e }))?.filter(
                            (e) => e
                        ) as Array<CoreProfile<any>>) ?? []
                    )
                })
            ).then((e) => {
                if (unmounted) return
                setProfiles(e.flat())
            })
        }, 500)

        return () => {
            unmounted = true
            clearTimeout(timer)
        }
    }, [profileSchema, selectedDomains, tab])

    const createNewStream = (stream: any): void => {
        client.api
            .upsertTimeline(Schemas.communityTimeline, stream)
            .then((e: any) => {
                const id: string = e.id
                if (id) navigate('/timeline/' + id)
                else enqueueSnackbar('ストリームの作成に失敗しました', { variant: 'error' })
            })
            .catch((e) => {
                console.error(e)
                enqueueSnackbar('ストリームの作成に失敗しました', { variant: 'error' })
            })
    }

    useEffect(() => {
        load()
    }, [])

    useEffect(() => {
        if (search === '') {
            setSearchResult(streams)
            return
        }
        setSearchResult(
            Fuzzysort.go(search, streams, {
                keys: ['stream.payload.name', 'stream.payload.description']
            }).map((e) => e.obj)
        )
    }, [search])

    if (!client.api.host) return <>loading...</>

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                padding: '20px',
                background: theme.palette.background.paper,
                minHeight: '100%',
                overflowY: 'scroll'
            }}
        >
            <Typography variant="h2" gutterBottom>
                {t('title')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1
                }}
            >
                <Box display="flex" alignItems="center" flexDirection="row">
                    <Typography variant="h3">{t('domains')}</Typography>
                    <IconButton
                        onClick={() => {
                            setOpenTips(!openTips)
                        }}
                    >
                        <HelpOutlineIcon />
                    </IconButton>
                </Box>
                <Box>
                    <IconButton
                        onClick={() => {
                            setSelectedDomains([])
                        }}
                    >
                        <RemoveDoneIcon />
                    </IconButton>
                    <IconButton
                        onClick={() => {
                            setSelectedDomains(domains)
                        }}
                    >
                        <DoneAllIcon />
                    </IconButton>
                </Box>
            </Box>
            <Box>
                <Collapse in={openTips}>
                    <Alert severity="info">
                        <AlertTitle>どうしてドメインごとに表示が分かれているの？</AlertTitle>
                        コンカレントは本来ユーザーやデータがどこのサーバー(ドメイン)にあるかを意識しないでに使えることを目指しています。
                        なのですが、現在はまだ十分な検索機能が実装されていないため、このような表示になっています。今後の進展にご期待ください。
                    </Alert>
                </Collapse>
            </Box>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 2
                }}
            >
                {domains.map((e) => (
                    <DomainCard
                        key={e}
                        domainFQDN={e}
                        selected={selectedDomains.includes(e)}
                        onClick={() => {
                            setSelectedDomains([e])
                        }}
                        onCheck={(state) => {
                            if (state) setSelectedDomains([...new Set([...selectedDomains, e])])
                            else setSelectedDomains(selectedDomains.filter((f) => f !== e))
                        }}
                    />
                ))}
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Tabs
                value={tab}
                onChange={(_, v) => {
                    navigate(`/explorer/${v}`)
                }}
            >
                <Tab value={'streams'} label={t('streams')} />
                <Tab value={'users'} label={'ユーザー'} />
            </Tabs>
            <Divider sx={{ mb: 2 }} />
            {tab === 'streams' && (
                <>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Typography variant="h3" gutterBottom>
                            {t('streams')}
                        </Typography>
                        <Button
                            onClick={() => {
                                setDrawerOpen(true)
                            }}
                        >
                            {t('createNew')}
                        </Button>
                    </Box>
                    <TextField
                        label="search"
                        variant="outlined"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                        }}
                    />
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: 2
                        }}
                    >
                        {searchResult.map((value) => {
                            return (
                                <StreamCard
                                    key={value.stream.id}
                                    streamID={value.stream.id}
                                    name={value.stream.document.body.name}
                                    description={value.stream.document.body.description ?? 'no description'}
                                    banner={value.stream.document.body.banner ?? ''}
                                    domain={value.domain}
                                    isOwner={value.stream.author === client.ccid}
                                />
                            )
                        })}
                    </Box>
                    <CCDrawer
                        open={drawerOpen}
                        onClose={() => {
                            setDrawerOpen(false)
                        }}
                    >
                        <Box p={1}>
                            <Typography variant="h3" gutterBottom>
                                {t('createNewStream.title')}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                {t('createNewStream.desc1')}
                                {client.api.host}
                                {t('createNewStream.desc2')}
                            </Typography>
                            <Divider />
                            <CCEditor
                                schemaURL={Schemas.communityTimeline}
                                value={timelineDraft}
                                setValue={setTimelineDraft}
                            />
                            <Button
                                onClick={() => {
                                    createNewStream(timelineDraft)
                                }}
                            >
                                作成
                            </Button>
                        </Box>
                    </CCDrawer>
                </>
            )}
            {tab === 'users' && (
                <>
                    <Typography variant="h3" gutterBottom>
                        プロフィール
                    </Typography>
                    <TextField
                        label="search"
                        variant="outlined"
                        value={profileSchema}
                        onChange={(e) => {
                            setProfileSchema(e.target.value)
                        }}
                    />
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: 2
                        }}
                    >
                        {characters.map((character) => (
                            <Paper key={character.id} variant="outlined">
                                <SubProfileCard showccid character={character} />
                            </Paper>
                        ))}
                    </Box>
                </>
            )}
        </Box>
    )
}
