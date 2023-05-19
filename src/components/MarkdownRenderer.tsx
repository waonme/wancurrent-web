import {
    type ImgHTMLAttributes,
    type DetailedHTMLProps,
    useContext
} from 'react'
import { Box, Typography } from '@mui/material'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { type ReactMarkdownProps } from 'react-markdown/lib/ast-to-react'
import breaks from 'remark-breaks'

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Emoji } from '../model'
import { ApplicationContext } from '../App'

export interface MarkdownRendererProps {
    messagebody: string
}

const sanitizeOption = {
    ...defaultSchema,
    tagNames: [...(defaultSchema.tagNames ?? []), 'marquee'],
    attributes: {
        ...defaultSchema.attributes,
        marquee: [
            ...(defaultSchema.attributes?.marquee ?? []),
            'direction',
            'behavior'
        ]
    }
}

export function MarkdownRenderer(props: MarkdownRendererProps): JSX.Element {
    const appData = useContext(ApplicationContext)

    const genEmojiTag = (emoji: Emoji): string => {
        return `<img src="${emoji.publicUrl}" alt="emoji:${emoji.name}:" title=":${emoji?.name}:"/>`
    }

    const messagebody = props.messagebody.replace(/:\w+:/gi, (name: string) => {
        const emoji: Emoji | undefined = appData.emojiDict[name.slice(1, -1)]
        if (emoji) {
            return genEmojiTag(emoji)
        }
        return `${name}`
    })

    return (
        <Box sx={{ width: '100%' }}>
            <ReactMarkdown
                remarkPlugins={[breaks, [remarkGfm, { singleTilde: false }]]}
                rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeOption]]}
                components={{
                    p: ({ children }) => (
                        <Typography
                            sx={{
                                fontSize: {
                                    xs: '0.9rem',
                                    sm: '1rem'
                                },
                                marginBottom: {
                                    xs: '4px',
                                    sm: '8px'
                                }
                            }}
                            paragraph
                        >
                            {children}
                        </Typography>
                    ),
                    h1: ({ children }) => (
                        <Typography variant="h1">{children}</Typography>
                    ),
                    h2: ({ children }) => (
                        <Typography variant="h2">{children}</Typography>
                    ),
                    h3: ({ children }) => (
                        <Typography variant="h3">{children}</Typography>
                    ),
                    h4: ({ children }) => (
                        <Typography variant="h4">{children}</Typography>
                    ),
                    h5: ({ children }) => (
                        <Typography variant="h5">{children}</Typography>
                    ),
                    h6: ({ children }) => (
                        <Typography variant="h6">{children}</Typography>
                    ),
                    ul: ({ children }) => <ul>{children}</ul>,
                    code: ({ node, children }) => {
                        const language = node.position
                            ? props.messagebody
                                  .slice(
                                      node.position.start.offset,
                                      node.position.end.offset
                                  )
                                  .split('\n')[0]
                                  .slice(3)
                            : ''
                        return (
                            <Box
                                sx={{
                                    overflow: 'hidden',
                                    borderRadius: '10px'
                                }}
                            >
                                <SyntaxHighlighter
                                    style={materialDark}
                                    language={language}
                                    PreTag="div"
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            </Box>
                        )
                    },
                    img: (
                        props: Pick<
                            DetailedHTMLProps<
                                ImgHTMLAttributes<HTMLImageElement>,
                                HTMLImageElement
                            >,
                            'key' | keyof ImgHTMLAttributes<HTMLImageElement>
                        > &
                            ReactMarkdownProps
                    ) => {
                        if (props.alt?.startsWith('emoji')) {
                            return (
                                <img
                                    {...props}
                                    style={{
                                        height: '1.5em',
                                        verticalAlign: '-0.5em'
                                    }}
                                />
                            )
                        }
                        return (
                            <img
                                {...props}
                                style={{
                                    maxWidth: '100%'
                                }}
                            />
                        )
                    }
                }}
            >
                {messagebody}
            </ReactMarkdown>
        </Box>
    )
}