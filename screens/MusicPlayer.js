import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
    FlatList,
    Animated
} from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Slider from '@react-native-community/slider'
import songs from '../model/Data'
import
TrackPlayer,
{
    Capability,
    Event,
    RepeatMode,
    State,
    usePlayback,
    usePlaybackState,
    useProgress,
    useTrackPlayerEvents
} from 'react-native-track-player'

const { width, height } = Dimensions.get('window')

const setUpPlayer = async () => {
    try {
        await TrackPlayer.setupPlayer()
        await TrackPlayer.updateOptions({
            capabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.SkipToNext,
                Capability.SkipToPrevious,
                Capability.Stop,
            ]
        })
        await TrackPlayer.add(songs)
    }
    catch (e) {
        console.log(e)
    }
}

const togglePlayBack = async (playBackState) => {
    const currentTrack = await TrackPlayer.getCurrentTrack()
    if (currentTrack != null) {
        if (playBackState == State.Paused) {
            await TrackPlayer.play()
        } else {
            await TrackPlayer.pause()
        }
    }
}

const MusicPlayer = () => {

    const playBackState = usePlaybackState()
    const progress = useProgress()

    const [songsIndex, setSongsIndex] = useState(0)
    const [trackTitle, setTrackTitle] = useState()
    const [trackArtist, setTrackArtist] = useState()
    const [trackArtWork, setTrackArtWork] = useState()

    const [repeatMode, setRepeatMode] = useState('off')

    // custom references
    const scrollX = useRef(new Animated.Value(0)).current
    const songSlider = useRef(null) // flatlist reference

    // changing the track on complete
    useTrackPlayerEvents([Event.PlaybackTrackChanged], async event => {
        if (event.type === Event.PlaybackTrackChanged && event.nextTrack !== null) {
            const track = await TrackPlayer.getTrack(event.nextTrack)
            const { title, artwork, artist } = track
            setTrackTitle(title)
            setTrackArtWork(artwork)
            setTrackArtist(artist)
        }
    })

    const repeatIcon = () => {
        if (repeatMode == 'off') {
            return 'repeat-off'
        }
        if (repeatMode == 'track') {
            return 'repeat-once'
        }
        if (repeatMode == 'repeat') {
            return 'repeat'
        }
    }

    const changeRepeatMode = () => {
        if (repeatMode == 'off') {
            TrackPlayer.setRepeatMode(RepeatMode.Track)
            setRepeatMode('track')
        }
        if (repeatMode == 'track') {
            TrackPlayer.setRepeatMode(RepeatMode.Queue)
            setRepeatMode('repeat')
        }
        if (repeatMode == 'repeat') {
            TrackPlayer.setRepeatMode(RepeatMode.Off)
            setRepeatMode('off')
        }
    }

    const skipTo = async trackId => {
        await TrackPlayer.skip(trackId)
    }

    useEffect(() => {
        setUpPlayer()
        scrollX.addListener(({ value }) => {
            // console.log(`Scroll: ${value} | Device Width: ${width}`)
            const index = Math.round(value / width)
            skipTo(index)
            setSongsIndex(index)
            // console.log(index)
        })

        return () => {
            scrollX.removeAllListeners()
            TrackPlayer.destroy()
        }
    }, [])

    const skipToNext = () => {
        songSlider.current.scrollToOffset({
            offset: (songsIndex + 1) * width
        })
    }
    const skipToPredius = () => {
        songSlider.current.scrollToOffset({
            offset: (songsIndex - 1) * width
        })
    }


    const renderSongs = ({ item, index }) => {
        return (
            <Animated.View style={styles.mainImageWrapper}>
                <View style={[styles.imageWrapper, styles.elevation]}>
                    <Image
                        source={trackArtWork}
                        style={styles.musicImage}
                    />
                </View>
            </Animated.View>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.maincontainer}>

                {/* image */}
                <Animated.FlatList
                    ref={songSlider}
                    renderItem={renderSongs}
                    data={songs}
                    keyExtractor={item => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onScroll={Animated.event(
                        [
                            {
                                nativeEvent: {
                                    contentOffset: { x: scrollX },
                                },
                            },
                        ],
                        { useNativeDriver: true },
                    )}
                />

                {/* Song content */}
                <View >
                    <Text style={[styles.songContent, styles.songTitle]}>{trackTitle}</Text>
                    <Text style={[styles.songContent, styles.songArtist]}>{trackArtist}</Text>
                </View>

                {/* slider */}
                <View>
                    <Slider
                        style={styles.progressBar}
                        value={progress.position}
                        minimumValue={0}
                        maximumValue={progress.duration}
                        thumbTintColor="#ffd369"
                        minimumTrackTintColor="#ffd369"
                        maximumTrackTintColor="#fff"
                        onSlidingComplete={async value => {
                            await TrackPlayer.seekTo(value)
                        }}
                    />
                    {/* music progress duration */}
                    <View style={styles.progressLevelDuration}>
                        <Text style={styles.progressLabelText}>
                            {new Date(progress.position * 1000).toLocaleTimeString().substring(3)}
                        </Text>
                        <Text style={styles.progressLabelText}>
                            {new Date(progress.duration * 1000).toLocaleTimeString().substring(3)}
                        </Text>
                    </View>
                </View>

                {/* music controls */}
                <View style={styles.musicControlsContainer}>
                    <TouchableOpacity onPress={skipToPredius}>
                        <Ionicons name="play-skip-back-outline" size={35} color='#ffd369' />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => togglePlayBack(playBackState)}>
                        <Ionicons
                            name={playBackState === State.Playing ? "ios-pause-circle" : "ios-play-circle"}
                            size={70} color='#ffd369' />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={skipToNext}>
                        <Ionicons name="play-skip-forward-outline" size={35} color='#ffd369' />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.bottomcontainer}>
                <View style={styles.bottomIconWrapper}>
                    <TouchableOpacity onPress={() => { }}>
                        <Ionicons name="heart-outline" size={30} color='#888888' />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={changeRepeatMode}>
                        <MaterialCommunityIcons
                            name={`${repeatIcon}`}
                            size={30}
                            color={repeatMode !== 'off' ? '#ffd369' : '#888888'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { }}>
                        <Ionicons name="share-outline" size={30} color='#888888' />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { }}>
                        <Ionicons name="ellipsis-horizontal" size={30} color='#888888' />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default MusicPlayer

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#222831'
    },
    maincontainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    bottomcontainer: {
        width: width,
        alignItems: 'center',
        paddingVertical: 15,
        borderTopColor: '#393e46',
        borderWidth: 1,
    },
    bottomIconWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
    },
    imageWrapper: {
        width: 350,
        height: 350,
        // marginBottom: 25,
        marginTop: 40
    },
    musicImage: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
    },
    elevation: {
        elevevation: 5,
        shadowColor: '#ccc',
        shadowOffset: {
            width: 5,
            height: 5
        },
        shadowOpacity: 0.5,
        shadowRadius: 3.84
    },
    songContent: {
        textAlign: 'center',
        color: 'white',
    },
    songTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    songArtist: {
        fontSize: 16,
        fontWeight: '300',
    },
    progressBar: {
        width: 350,
        height: 40,
        marginTop: 25,
        flexDirection: 'row',
    },
    progressLevelDuration: {
        width: 340,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressLabelText: {
        color: 'white',
        fontWeight: '500'
    },
    musicControlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '60%',
        marginBottom: 15,
    },
    mainImageWrapper: {
        width: width,
        justifyContent: 'center',
        alignItems: 'center',
        // marginTop: 25,
    }
});