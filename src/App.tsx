import { useEffect, useState } from 'react';
import { Avatar, Box, Button, Divider, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, Paper, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { ec } from 'elliptic';
import { keccak256 } from 'ethers';

import { usePersistent } from './hooks/usePersistent';
import { Timeline } from './components/Timeline';

import { useObjectList } from './hooks/useObjectList';
import { useResourceManager } from './hooks/useResourceManager';
import type { StreamElement, RTMMessage, User } from './model';

const profile_schema = 'https://raw.githubusercontent.com/totegamma/concurrent-schemas/master/characters/profile/v1.json';

function App() {

    const [server, setServer] = usePersistent<string>("ServerAddress", "");
    const [pubkey, setPubKey] = usePersistent<string>("PublicKey", "");
    const [prvkey, setPrvKey] = usePersistent<string>("PrivateKey", "");

    const [postStreams, setPostStreams] = usePersistent<string>("postStream", "common");
    const [currentStreams, setCurrentStreams] = usePersistent<string>("currentStream", "common,0");

    const [followee, setFollowee] = usePersistent<User[]>("Follow", []);

    const [username, setUsername] = usePersistent<string>("Username", "anonymous");
    const [avatar, setAvatar] = usePersistent<string>("AvatarURL", "");

    const [draft, setDraft] = useState<string>("");

    const messages = useObjectList<StreamElement>();

    const userDict = useResourceManager<User>(async (key: string) => {
        const res = await fetch(server + 'characters?author=' + encodeURIComponent(key) + '&schema=' + encodeURIComponent(profile_schema), {
            method: 'GET',
            headers: {}
        });
        const data = await res.json();
        const payload = JSON.parse(data.characters[0].payload)
        return {
            pubkey: data.characters[0].author,
            username: payload.username,
            avatar: payload.avatar,
            description: payload.description
        };
    });

    const messageDict = useResourceManager<RTMMessage>(async (key: string) => {
        const res = await fetch(server + `messages/${key}`, {
            method: 'GET',
            headers: {}
        });
        const data = await res.json()
        return data.message
    });

    useEffect(() => {
        if (pubkey == "" && prvkey == "") regenerateKeys();
        reload();
    }, []);

    const reload = () => {
        let url = server + `stream?streams=${currentStreams}`

        const requestOptions = {
            method: 'GET',
            headers: {}
        };

        fetch(url, requestOptions)
        .then(res => res.json())
        .then((data: StreamElement[]) => {
            console.log(data);
            messages.clear();
            data.sort((a, b) => a.ID > b.ID ? -1 : 1).forEach((e: StreamElement) => messages.push(e));
        });
    }

    const regenerateKeys = () => {
        const ellipsis = new ec("secp256k1")
        const keyPair = ellipsis.genKeyPair()
        const privateKey = keyPair.getPrivate().toString('hex')
        const publicKey = keyPair.getPublic().encode('hex', false)
        console.log('Private key: ', privateKey)
        console.log('Public key: ', publicKey)

        setPubKey(publicKey)
        setPrvKey(privateKey)
    }

    function toHexString(byteArray: Uint8Array | number[]) {
        return Array.from(byteArray, function(byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('')
    }

    const post = () => {
        const ellipsis = new ec("secp256k1")
        const keyPair = ellipsis.keyFromPrivate(prvkey)

        const payload_obj = {
            'body': draft
        }

        const payload = JSON.stringify(payload_obj)
        const messageHash = keccak256(new TextEncoder().encode(payload)).slice(2)
        const signature = keyPair.sign(messageHash, 'hex', {canonical: true})
        const r = toHexString(signature.r.toArray())
        const s = toHexString(signature.s.toArray())

        const requestOptions = {
            method: 'POST',
            headers: {},
            body: JSON.stringify({
                author: pubkey,
                payload: payload,
                r: r,
                s: s,
                streams: "common,local"
            })
        };

        fetch(server + 'messages', requestOptions)
        .then(res => res.json())
        .then(data => {
            console.log(data);
            setDraft("");
            reload();
        });
    }

    const updateProfile = () => {
        const ellipsis = new ec("secp256k1")
        const keyPair = ellipsis.keyFromPrivate(prvkey)

        const payload_obj = {
            'username': username,
            'avatar': avatar,
            'description': ''
        }

        const payload = JSON.stringify(payload_obj);
        const messageHash = keccak256(new TextEncoder().encode(payload)).slice(2)
        const signature = keyPair.sign(messageHash, 'hex', {canonical: true})
        const r = toHexString(signature.r.toArray())
        const s = toHexString(signature.s.toArray())

        const requestOptions = {
            method: 'PUT',
            headers: {},
            body: JSON.stringify({
                'author': pubkey,
                'schema': profile_schema,
                'payload': payload,
                r: r,
                s: s
            })
        };

        fetch(server + 'characters', requestOptions)
        .then(res => res.json())
        .then(data => {
            console.log(data);
            setDraft("");
            reload();
        });

    }

    const follow = async (userid: string) => {
        if (followee.find(e => e.pubkey == userid)) return;
        let user = await userDict.get(userid)
        setFollowee([...followee, user]);
    }

    const unfollow = (pubkey: string) => {
        setFollowee(followee.filter(e => e.pubkey != pubkey));
    }

    return (<Box sx={{display: "flex", padding: "10px", gap: "10px", backgroundColor: "#f2f2f2", width: "100vw", height: "100vh", justifyContent: "center"}}>
        <Paper sx={{width: "800px", padding: "15px", display: "flex", flexFlow: "column"}}>
            <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "5px"}}>
            <Typography variant="h5" gutterBottom>Timeline</Typography>
            <Box>
                <TextField label="watchStreams" variant="outlined" value={currentStreams} onChange={(e) => setCurrentStreams(e.target.value)}/>
                <Button variant="contained" onClick={_ => reload()}>GO</Button>
            </Box>
            </Box>
            <Divider/>
            <Box sx={{overflowY: "scroll"}}>
                <Timeline messages={messages} messageDict={messageDict} clickAvatar={follow} userDict={userDict}/>
            </Box>
        </Paper>
        <Box sx={{display: "flex", flexDirection: "column", gap: "15px"}}>
            <Paper sx={{width: "300px", padding: "5px"}}>
                <Typography variant="h5" gutterBottom>Post</Typography>
                <Divider/>
                <Box sx={{display: "flex", flexDirection: "column", padding: "15px", gap: "5px"}}>
                    <TextField label="postStreams" variant="outlined" value={postStreams} onChange={(e) => setUsername(e.target.value)}/>
                    <TextField multiline rows={6} label="message" variant="outlined" value={draft} onChange={(e) => setDraft(e.target.value)}/>
                    <Button variant="contained" onClick={_ => post()}>post</Button>
                </Box>
            </Paper>

            <Paper sx={{width: "300px", padding: "5px"}}>
                <Typography variant="h5" gutterBottom>Following</Typography>
                <Divider/>
                <Box sx={{display: "flex", flexDirection: "column", gap: "5px"}}>
                    <List dense sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
                    {followee.map((value) => {
                        const labelId = `checkbox-list-secondary-label-${value.pubkey}`;
                        return (
                        <ListItem
                            key={value.username}
                            secondaryAction={
                                <Button onClick={() => unfollow(value.pubkey)}>unfollow</Button>
                            }
                            disablePadding
                        >
                            <ListItemButton>
                                <ListItemAvatar>
                                    <Avatar src={value.avatar} />
                                </ListItemAvatar>
                                <ListItemText id={labelId} primary={value.username} />
                            </ListItemButton>
                        </ListItem>
                        );
                    })}
                    </List>
                </Box>
            </Paper>

            <Paper sx={{width: "300px", padding: "5px"}}>
                <Typography variant="h5" gutterBottom>Profile</Typography>
                <Divider/>
                <Box sx={{display: "flex", flexDirection: "column", padding: "15px", gap: "5px"}}>
                    <TextField label="username" variant="outlined" value={username} onChange={(e) => setUsername(e.target.value)}/>
                    <TextField label="avatarURL" variant="outlined" value={avatar} onChange={(e) => setAvatar(e.target.value)}/>
                    <Button variant="contained" onClick={_ => updateProfile()}>Update</Button>
                </Box>
            </Paper>

            <Paper sx={{width: "300px", padding: "5px"}}>
                <Typography variant="h5" gutterBottom>Settings</Typography>
                <Divider/>
                <Box sx={{display: "flex", flexDirection: "column", padding: "15px", gap: "5px"}}>
                    <TextField label="server" variant="outlined" value={server} onChange={(e) => setServer(e.target.value)}/>
                    <TextField label="privateKey" variant="outlined" value={prvkey} onChange={(e) => setPrvKey(e.target.value)}/>
                    <TextField label="publicKey" variant="outlined" value={pubkey} onChange={(e) => setPubKey(e.target.value)}/>
                    <Button variant="contained" onClick={_ => regenerateKeys()}>Generate Key</Button>
                </Box>
            </Paper>
        </Box>
    </Box>)
}

export default App
