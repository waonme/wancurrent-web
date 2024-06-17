import React, { useState, useRef } from 'react'
import { Box, Button, Slider, Typography, Divider, TextField } from '@mui/material'
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
    const [isRecording, setIsRecording] = useState(false)
    const [recordedData, setRecordedData] = useState<Array<{ time: number; sound: string }>>([])
    const [activePad, setActivePad] = useState<string | null>(null)
    const startTime = useRef<number | null>(null)

    const soundPlayers = soundOptionLabels.reduce<Record<string, () => void>>((acc, label) => {
        const [play] = useSound(soundOptions[label], { volume })
        acc[label] = play
        return acc
    }, {})

    const handleRecord = (sound: string): void => {
        if (isRecording && startTime.current !== null) {
            const currentTime = Date.now()
            const time = (currentTime - startTime.current) / 1000
            setRecordedData((prev) => [...prev, { time, sound }])
        }
    }

    const createSoundButtons = (): JSX.Element[] => {
        return soundOptionLabels.map((label) => {
            const handleClick = (): void => {
                soundPlayers[label]()
                handleRecord(label)
                setActivePad(label)
                setTimeout(() => {
                    setActivePad(null)
                }, 200) // クリック後200msで元に戻す
            }
            return (
                <Box
                    key={label}
                    onClick={handleClick}
                    sx={{
                        width: 100,
                        height: 100,
                        backgroundColor:
                            activePad === label ? theme.palette.secondary.main : theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: 24,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        boxShadow: activePad === label ? theme.shadows[4] : theme.shadows[1],
                        cursor: 'pointer',
                        transition: 'background-color 0.2s, box-shadow 0.2s'
                    }}
                >
                    {label}
                </Box>
            )
        })
    }

    const handleStartRecording = (): void => {
        setIsRecording(true)
        startTime.current = Date.now()
        setRecordedData([])
    }

    const handleStopRecording = (): void => {
        setIsRecording(false)
        startTime.current = null
    }

    const generateMML = (): string => {
        return recordedData.map((record) => `t${record.time} ${record.sound}`).join(' ')
    }

    const handlePlay = (): void => {
        if (recordedData.length === 0) return

        const startTime = Date.now()

        recordedData.forEach(({ time, sound }) => {
            const delay = (time - (Date.now() - startTime) / 1000) * 1000
            setTimeout(() => {
                soundPlayers[sound]()
                setActivePad(sound)
                setTimeout(() => {
                    setActivePad(null)
                }, 200) // 再生後200msで元に戻す
            }, delay)
        })
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: 2,
                backgroundColor: theme.palette.background.paper,
                borderRadius: 1,
                boxShadow: theme.shadows[3],
                minHeight: '100vh',
                overflowY: 'scroll'
            }}
        >
            <Typography variant="h4" gutterBottom>
                Drum Pad
            </Typography>
            <Slider
                value={volume}
                onChange={(e, newValue) => {
                    setVolume(newValue as number)
                }}
                aria-labelledby="volume-slider"
                min={0}
                max={1}
                step={0.01}
                valueLabelDisplay="auto"
                sx={{ marginBottom: 2 }}
            />
            <Divider sx={{ marginY: 2 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 2 }}>
                {createSoundButtons()}
            </Box>
            <TextField
                label="Columns"
                type="number"
                value={columns}
                onChange={(e) => {
                    setColumns(parseInt(e.target.value, 10))
                }}
                sx={{ marginTop: 2 }}
                inputProps={{ min: 1, max: 5 }}
            />
            <Box sx={{ marginTop: 2, display: 'flex', gap: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
                <Button variant="contained" color="secondary" onClick={handlePlay}>
                    Play Recording
                </Button>
            </Box>
            <Box sx={{ marginTop: 2 }}>
                <Typography variant="body1">MML Output:</Typography>
                <TextField value={generateMML()} multiline rows={4} fullWidth variant="outlined" />
            </Box>
        </Box>
    )
}
