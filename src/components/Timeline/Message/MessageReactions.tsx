import type { Message as CCMessage, ProfileWithAddress } from '../../../model'
import type { SimpleNote as TypeSimpleNote } from '../../../schemas/simpleNote'
import type { ReplyMessage } from '../../../schemas/replyMessage'
import { Box, Button, Divider, Tooltip, Typography, alpha, useTheme } from '@mui/material'
import { Schemas } from '../../../schemas'
import { useApi } from '../../../context/api'
import { CCAvatar } from '../../CCAvatar'
import { Fragment } from 'react'
import { type EmojiProps } from '../../EmojiPicker'

export interface MessageReactionsProps {
    message: CCMessage<TypeSimpleNote | ReplyMessage>
    emojiUsers: ProfileWithAddress[]
    addMessageReaction: (emoji: EmojiProps) => Promise<void>
    removeMessageReaction: (id: string) => Promise<void>
}

export const MessageReactions = (props: MessageReactionsProps): JSX.Element => {
    const api = useApi()
    const theme = useTheme()
    const allReactions = props.message.associations.filter((m) => m.schema === Schemas.emojiAssociation)
    const filteredReactions = allReactions.reduce((acc: any, cur) => {
        cur.payload.body.shortcode in acc
            ? acc[cur.payload.body.shortcode].push(cur)
            : (acc[cur.payload.body.shortcode] = [cur])

        return acc
    }, {})

    return (
        <Box display="flex" gap={1}>
            {Object.entries(filteredReactions).map((r) => {
                const [shortcode, reaction]: [string, any] = r
                const ownReaction = reaction.find((x: any) => x.author === api.userAddress)
                const reactedUsers =
                    reaction.map((x: any) => props.emojiUsers.find((u) => u.ccaddress === x.author)) ?? []
                const reactedUsersList = reactedUsers.map((user: ProfileWithAddress | undefined) => {
                    return user !== undefined ? (
                        <Box
                            key={user.ccaddress}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <CCAvatar
                                sx={{
                                    height: '20px',
                                    width: '20px'
                                }}
                                avatarURL={user.avatar}
                                identiconSource={user.ccaddress}
                                alt={user.ccaddress}
                            />
                            {user.username ?? 'anonymous'}
                        </Box>
                    ) : (
                        <Fragment key={0} />
                    )
                })

                return (
                    <Tooltip
                        arrow
                        key={shortcode}
                        title={
                            <Box display="flex" flexDirection="column" alignItems="right" gap={1}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box component="img" height="20px" src={reaction[0].payload.body.imageUrl}></Box>
                                    {shortcode}
                                </Box>
                                <Divider flexItem></Divider>
                                {reactedUsersList}
                            </Box>
                        }
                        placement="top"
                    >
                        <Button
                            sx={{
                                p: 0,
                                gap: 1,
                                display: 'flex',
                                backgroundColor: ownReaction ? alpha(theme.palette.primary.main, 0.5) : 'transparent',
                                borderColor: theme.palette.primary.main
                            }}
                            variant="outlined"
                            onClick={() => {
                                if (ownReaction) {
                                    props.removeMessageReaction(ownReaction.id)
                                } else {
                                    props.addMessageReaction({
                                        id: '',
                                        keywords: [],
                                        name: shortcode,
                                        native: '',
                                        shortcodes: shortcode,
                                        src: reaction[0].payload.body.imageUrl
                                    })
                                }
                            }}
                        >
                            <Box component="img" height="20px" src={reaction[0].payload.body.imageUrl} />
                            <Typography color={ownReaction ? 'primary.contrastText' : 'text.primary'}>
                                {reaction.length}
                            </Typography>
                        </Button>
                    </Tooltip>
                )
            })}
        </Box>
    )
}