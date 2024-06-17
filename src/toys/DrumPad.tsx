import React, { useState } from 'react'
import { Box, Slider, Typography, Divider, TextField } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import useSound from 'use-sound'
import BubbleSound from '../resources/Bubble.wav'
import NotificationSound from '../resources/Notification.wav'
import Bright_Post from '../resources/Bright_Post.wav'
import Bright_Notification from '../resources/Bright_Notification.wav'
import Arakoshi_Suzu from '../resources/Arakoshi_Suzu.wav'
import Arakoshi_Send2 from '../resources/Arakoshi_Send2.wav'
import Arakoshi_Send from '../resources/Arakoshi_Send.wav'
import Arakoshi_Notify from '../resources/Arakoshi_Notify.wav'
import Arakoshi_Up from '../resources/Arakoshi_Up.wav'

const soundOptions: Record<string, string> = {
    pop: BubbleSound,
    popi: NotificationSound,
    Bright_Post,
    Bright_Notification,
    Arakoshi_Suzu,
    Arakoshi_Send2,
    Arakoshi_Send,
    Arakoshi_Notify,
    Arakoshi_Up
}

const soundOptionLabels = Object.keys(soundOptions)

export function DrumPad(): JSX.Element {
    const theme = useTheme()

    const [volume, setVolume] = useState(0.5)
    const [columns, setColumns] = useState(3)

    const createSoundButtons = (): JSX.Element[] => {
        return soundOptionLabels.map((label) => {
            const [play] = useSound(soundOptions[label], { volume })
            const handleClick = (): void => {
                play()
            }
            return (
                <Box
                    key={label}
                    onClick={handleClick}
                    sx={{
                        width: 100,
                        height: 100,
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: 24,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                            backgroundColor: theme.palette.primary.dark
                        },
                        margin: 1
                    }}
                >
                    {label}
                </Box>
            )
        })
    }

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
                Sound Test Pad
            </Typography>
            <Divider sx={{ width: '100%', marginBottom: 2 }} />
            <Box
                sx={{
                    display: 'flex',
                    gap: 4,
                    alignItems: 'center',
                    marginBottom: 2
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 2
                    }}
                >
                    <Typography variant="h4" gutterBottom>
                        Volume
                    </Typography>
                    <Slider
                        aria-label="Volume"
                        value={volume}
                        onChange={(_, value) => {
                            setVolume(value as number)
                        }}
                        min={0}
                        max={1}
                        step={0.01}
                        sx={{ width: '150px' }}
                    />
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 2
                    }}
                >
                    <Typography variant="h4" gutterBottom>
                        Columns
                    </Typography>
                    <TextField
                        type="number"
                        value={columns}
                        onChange={(e) => {
                            setColumns(parseInt(e.target.value, 10))
                        }}
                        inputProps={{ min: 1 }}
                        sx={{ width: '80px' }}
                    />
                </Box>
            </Box>
            <Box
                sx={{
                    display: 'grid',
                    gap: '10px',
                    gridTemplateColumns: `repeat(${columns}, 100px)`,
                    justifyContent: 'center'
                }}
            >
                {createSoundButtons()}
            </Box>
        </Box>
    )
}

export default DrumPad
