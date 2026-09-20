import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://ryp-hpvu.onrender.com/chat";
const CHAT_KEY = "ryp_saved_chats_v7";

const RYP_IMAGE = require(
  "./file_00000000e44c81f4b86b60e21106fc88.png"
);

const { width } = Dimensions.get("window");

const WELCOME = {
  id: "welcome",
  role: "assistant",
  content:
    "Čau. Já jsem Rýp. Tak povídej, co zase potřebuješ. 😉",
};

function makeId() {
  return (
    Date.now().toString() +
    Math.random().toString(36).slice(2)
  );
}

function Message({ item }) {
  const mine = item.role === "user";

  return (
    <View
      style={[
        styles.messageRow,
        mine && styles.messageRowMine,
      ]}
    >
      {!mine && (
        <Image
          source={RYP_IMAGE}
          style={styles.messageAvatar}
        />
      )}

      <View
        style={[
          styles.messageBubble,
          mine
            ? styles.userBubble
            : styles.aiBubble,
        ]}
      >
        <Text style={styles.messageText}>
          {item.content}
        </Text>
      </View>
    </View>
  );
}

export default function App() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [savedChats, setSavedChats] = useState([]);

  const [activeTab, setActiveTab] =
    useState("chat");

  const [modal, setModal] = useState(null);

  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    loadChats();
  }, []);

  async function loadChats() {
    try {
      const raw =
        await AsyncStorage.getItem(CHAT_KEY);

      if (raw) {
        setSavedChats(JSON.parse(raw));
      }
    } catch (e) {}
  }

  async function persistChats(chats) {
    setSavedChats(chats);

    await AsyncStorage.setItem(
      CHAT_KEY,
      JSON.stringify(chats)
    );
  }

  function newChat() {
    setMessages([WELCOME]);
    setInput("");
    setPhoto(null);
    setActiveTab("chat");
    setModal(null);
  }

  async function saveChat() {
    if (messages.length <= 1) {
      Alert.alert(
        "Rýp",
        "Nejdřív si s Rýpem něco napiš 😈"
      );
      return;
    }

    const firstUser = messages.find(
      (m) => m.role === "user"
    );

    const title =
      firstUser?.content?.slice(0, 35) ||
      "Nový chat";

    const chat = {
      id: makeId(),
      title,
      date: new Date().toLocaleString("cs-CZ"),
      messages,
    };

    await persistChats([
      chat,
      ...savedChats,
    ]);

    Alert.alert(
      "Hotovo",
      "Chat je uložený."
    );
  }

  async function deleteChat(id) {
    const next = savedChats.filter(
      (c) => c.id !== id
    );

    await persistChats(next);
  }

  function openChat(chat) {
    setMessages(
      chat.messages?.length
        ? chat.messages
        : [WELCOME]
    );

    setModal(null);
    setActiveTab("chat");
  }

  async function sendMessage() {
    const text = input.trim();

    if (!text || loading) return;

    const userMessage = {
      id: makeId(),
      role: "user",
      content: text,
    };

    const nextMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const history =
        nextMessages
          .slice(-12)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

      const response = await fetch(
        API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            message: text,
            history,
          }),
        }
      );

      const data = await response.json();

      const answer =
        data?.reply ||
        data?.message ||
        data?.response ||
        "Rýp se zasekl. Zkus to ještě jednou 😈";

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (e) {
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content:
            "Teď mi to nějak nejede. Zkus to za chvíli znovu 😈",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function pickPhoto(camera = false) {
    try {
      let result;

      if (camera) {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Foto",
            "Rýp potřebuje povolení ke kameře."
          );
          return;
        }

        result =
          await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Foto",
            "Rýp potřebuje přístup k fotkám."
          );
          return;
        }

        result =
          await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });
      }

      if (
        !result.canceled &&
        result.assets?.[0]?.uri
      ) {
        setPhoto(result.assets[0].uri);
        setModal("photo");
      }
    } catch (e) {
      Alert.alert(
        "Foto",
        "Fotku se nepodařilo otevřít."
      );
    }
  }

  function selectTab(tab) {
    setActiveTab(tab);

    if (tab === "chat") return;

    if (tab === "photo") {
      setModal("photoMenu");
    }

    if (tab === "games") {
      setModal("games");
    }

    if (tab === "more") {
      setModal("more");
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#02070D"
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.backgroundGlow} />

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Message item={item} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.chatContent
          }
          ListHeaderComponent={
            <View style={styles.hero}>
              <View style={styles.heroArtwork}>
                <View style={styles.blueRing} />

                <Image
                  source={RYP_IMAGE}
                  style={styles.heroImage}
                />
              </View>

              <Text style={styles.logoText}>
                Rýp
              </Text>

              <View style={styles.logoStroke} />

              <Text style={styles.slogan}>
                AI, která se s tebou nemaže.
                <Text style={styles.crown}>
                  {" "}♕
                </Text>
              </Text>
            </View>
          }
        />

        {loading && (
          <View style={styles.loadingRow}>
            <Image
              source={RYP_IMAGE}
              style={styles.loadingAvatar}
            />

            <Text style={styles.loadingText}>
              Rýp přemýšlí… 😈
            </Text>
          </View>
        )}

        <View style={styles.composerRow}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => pickPhoto(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="camera"
              size={42}
              color="#EAF4FF"
            />
          </TouchableOpacity>

          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            placeholder="Napiš Rýpovi..."
            placeholderTextColor="#8EA8D1"
            style={styles.input}
            multiline
            maxLength={2000}
          />

          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            activeOpacity={0.75}
          >
            <Ionicons
              name="send"
              size={42}
              color="#071000"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <BottomButton
            active={activeTab === "chat"}
            icon="chatbubble"
            label="Chat"
            onPress={() =>
              selectTab("chat")
            }
          />

          <BottomButton
            active={activeTab === "games"}
            icon="game-controller"
            label="Hry"
            onPress={() =>
              selectTab("games")
            }
          />

          <BottomButton
            active={activeTab === "photo"}
            icon="camera"
            label="Foto"
            onPress={() =>
              selectTab("photo")
            }
          />

          <BottomButton
            active={activeTab === "more"}
            icon="menu"
            label="Další"
            onPress={() =>
              selectTab("more")
            }
          />
        </View>
      </KeyboardAvoidingView>

      {/* FOTO MENU */}
      <Modal
        visible={modal === "photoMenu"}
        transparent
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Foto
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() =>
                pickPhoto(true)
              }
            >
              <Ionicons
                name="camera"
                size={24}
                color="#8BB8FF"
              />

              <Text
                style={styles.modalButtonText}
              >
                Vyfotit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() =>
                pickPhoto(false)
              }
            >
              <Ionicons
                name="images"
                size={24}
                color="#8BB8FF"
              />

              <Text
                style={styles.modalButtonText}
              >
                Vybrat z galerie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() =>
                setModal(null)
              }
            >
              <Text style={styles.closeText}>
                Zavřít
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FOTO */}
      <Modal
        visible={modal === "photo"}
        transparent
        animationType="slide"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.photoModal}>
            <Text style={styles.modalTitle}>
              Tvoje fotka
            </Text>

            {photo && (
              <Image
                source={{ uri: photo }}
                style={styles.photoPreview}
              />
            )}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModal(null);
                setInput(
                  "Podívej se na tuhle fotku a řekni mi, co na ní vidíš."
                );
                setActiveTab("chat");
              }}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={24}
                color="#A6FF00"
              />

              <Text
                style={styles.modalButtonText}
              >
                Použít v chatu
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() =>
                setModal(null)
              }
            >
              <Text style={styles.closeText}>
                Zavřít
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HRY */}
      <Modal
        visible={modal === "games"}
        transparent
        animationType="slide"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Hry
            </Text>

            <View style={styles.gameCard}>
              <Ionicons
                name="game-controller"
                size={38}
                color="#8BB8FF"
              />

              <View
                style={{
                  flex: 1,
                  marginLeft: 14,
                }}
              >
                <Text style={styles.gameTitle}>
                  Rýpovy hry
                </Text>

                <Text
                  style={
                    styles.gameDescription
                  }
                >
                  Herní sekce je připravená na další minihry.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() =>
                setModal(null)
              }
            >
              <Text style={styles.closeText}>
                Zavřít
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DALŠÍ */}
      <Modal
        visible={modal === "more"}
        transparent
        animationType="slide"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Další
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() =>
                setModal("saved")
              }
            >
              <Ionicons
                name="bookmark"
                size={24}
                color="#8BB8FF"
              />

              <Text
                style={styles.modalButtonText}
              >
                Uložené chaty
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={saveChat}
            >
              <Ionicons
                name="save"
                size={24}
                color="#A6FF00"
              />

              <Text
                style={styles.modalButtonText}
              >
                Uložit tento chat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={newChat}
            >
              <Ionicons
                name="add-circle"
                size={24}
                color="#8BB8FF"
              />

              <Text
                style={styles.modalButtonText}
              >
                Nový chat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() =>
                setModal("about")
              }
            >
              <Ionicons
                name="information-circle"
                size={24}
                color="#8BB8FF"
              />

              <Text
                style={styles.modalButtonText}
              >
                O Rýpovi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() =>
                setModal(null)
              }
            >
              <Text style={styles.closeText}>
                Zavřít
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ULOŽENÉ CHATY */}
      <Modal
        visible={modal === "saved"}
        transparent
        animationType="slide"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.savedBox}>
            <Text style={styles.modalTitle}>
              Uložené chaty
            </Text>

            {savedChats.length === 0 ? (
              <Text style={styles.emptyText}>
                Zatím tu nic není.
              </Text>
            ) : (
              <FlatList
                data={savedChats}
                keyExtractor={(item) =>
                  item.id
                }
                showsVerticalScrollIndicator={
                  false
                }
                renderItem={({
                  item,
                }) => (
                  <View
                    style={styles.savedRow}
                  >
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() =>
                        openChat(item)
                      }
                    >
                      <Text
                        style={
                          styles.savedTitle
                        }
                      >
                        {item.title}
                      </Text>

                      <Text
                        style={
                          styles.savedDate
                        }
                      >
                        {item.date}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        deleteChat(item.id)
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={23}
                        color="#FF657A"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() =>
                setModal(null)
              }
            >
              <Text style={styles.closeText}>
                Zavřít
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* O RÝPOVI */}
      <Modal
        visible={modal === "about"}
        transparent
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.aboutBox}>
            <Image
              source={RYP_IMAGE}
              style={styles.aboutImage}
            />

            <Text style={styles.aboutTitle}>
              RýpAI
            </Text>

            <Text style={styles.aboutText}>
              AI, která se s tebou nemaže. 😈
            </Text>

            <Text style={styles.version}>
              Verze 1.1
            </Text>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() =>
                setModal(null)
              }
            >
              <Text style={styles.closeText}>
                Zavřít
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function BottomButton({
  active,
  icon,
  label,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.bottomButton}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons
        name={icon}
        size={42}
        color={
          active
            ? "#A6FF00"
            : "#8EA8D1"
        }
      />

      <Text
        style={[
          styles.bottomLabel,
          active &&
            styles.bottomLabelActive,
        ]}
      >
        {label}
      </Text>

      {active && (
        <View style={styles.activeLine} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#02070D",
  },

  container: {
    flex: 1,
    backgroundColor: "#02070D",
  },

  backgroundGlow: {
    position: "absolute",
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width,
    backgroundColor: "#06233A",
    opacity: 0.18,
    top: -width * 0.42,
    alignSelf: "center",
  },

  chatContent: {
    paddingTop: 4,
    paddingBottom: 15,
  },

  hero: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 18,
  },

  heroArtwork: {
    width: 250,
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  blueRing: {
    position: "absolute",
    width: 226,
    height: 226,
    borderRadius: 113,
    borderWidth: 6,
    borderColor: "#00A8FF",
    opacity: 0.9,
  },

  heroImage: {
    width: 220,
    height: 220,
    borderRadius: 110,
    resizeMode: "cover",
  },

  logoText: {
    marginTop: -5,
    color: "#FFFFFF",
    fontSize: 76,
    lineHeight: 84,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -4,
    textShadowColor: "#009EFF",
    textShadowOffset: {
      width: 7,
      height: 5,
    },
    textShadowRadius: 0,
  },

  logoStroke: {
    width: 180,
    height: 12,
    backgroundColor: "#00A8FF",
    borderRadius: 10,
    transform: [
      { rotate: "-5deg" },
    ],
    marginTop: -6,
    marginLeft: 38,
  },

  slogan: {
    color: "#8EA8D1",
    fontSize: 25,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },

  crown: {
    color: "#00A8FF",
    fontSize: 30,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 28,
    marginTop: 10,
    marginBottom: 10,
  },

  messageRowMine: {
    justifyContent: "flex-end",
  },

  messageAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: "#00A8FF",
    marginRight: 16,
  },

  messageBubble: {
    maxWidth: "79%",
    paddingHorizontal: 24,
    paddingVertical: 22,
    borderRadius: 32,
  },

  aiBubble: {
    backgroundColor: "#182231",
    borderWidth: 1,
    borderColor: "#23344A",
  },

  userBubble: {
    backgroundColor: "#A6FF00",
  },

  messageText: {
    color: "#F2F7FF",
    fontSize: 23,
    lineHeight: 31,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 30,
    marginBottom: 8,
  },

  loadingAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
  },

  loadingText: {
    color: "#8EA8D1",
    fontSize: 15,
  },

  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 14,
  },

  cameraButton: {
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 2,
    borderColor: "#0D73B9",
    backgroundColor: "#091522",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  input: {
    flex: 1,
    minHeight: 112,
    maxHeight: 145,
    backgroundColor: "#101B29",
    borderWidth: 2,
    borderColor: "#1C426D",
    borderRadius: 58,
    paddingHorizontal: 32,
    paddingVertical: 26,
    color: "#F2F7FF",
    fontSize: 25,
  },

  sendButton: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: "#A6FF00",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },

  bottomBar: {
    height: 142,
    borderTopWidth: 2,
    borderColor: "#12304F",
    backgroundColor: "#07111C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingBottom:
      Platform.OS === "ios" ? 10 : 2,
  },

  bottomButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    position: "relative",
  },

  bottomLabel: {
    color: "#8EA8D1",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },

  bottomLabelActive: {
    color: "#A6FF00",
  },

  activeLine: {
    position: "absolute",
    bottom: 7,
    width: 82,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#A6FF00",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.78)",
    justifyContent: "flex-end",
  },

  modalBox: {
    backgroundColor: "#0B1623",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "#244464",
    padding: 26,
    paddingBottom: 36,
  },

  photoModal: {
    backgroundColor: "#0B1623",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 22,
    paddingBottom: 35,
    maxHeight: "90%",
  },

  savedBox: {
    backgroundColor: "#0B1623",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 35,
    maxHeight: "80%",
  },

  aboutBox: {
    backgroundColor: "#0B1623",
    marginHorizontal: 25,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#244464",
    padding: 28,
    alignItems: "center",
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 20,
  },

  modalButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "#111F30",
    borderWidth: 1,
    borderColor: "#213B58",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 10,
  },

  modalButtonText: {
    color: "#F1F6FF",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 13,
  },

  closeButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    marginTop: 8,
  },

  closeText: {
    color: "#8EA8D1",
    fontSize: 17,
    fontWeight: "700",
  },

  photoPreview: {
    width: "100%",
    height: 390,
    borderRadius: 22,
    backgroundColor: "#02070D",
    marginBottom: 16,
  },

  gameCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111F30",
    borderWidth: 1,
    borderColor: "#213B58",
    borderRadius: 20,
    padding: 18,
  },

  gameTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  gameDescription: {
    color: "#8EA8D1",
    fontSize: 14,
    marginTop: 4,
    lineHeight: 19,
  },

  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111F30",
    borderWidth: 1,
    borderColor: "#213B58",
    borderRadius: 17,
    padding: 15,
    marginBottom: 9,
  },

  savedTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  savedDate: {
    color: "#7892B8",
    fontSize: 12,
    marginTop: 4,
  },

  emptyText: {
    color: "#8EA8D1",
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 30,
  },

  aboutImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#00A8FF",
    marginBottom: 12,
  },

  aboutTitle: {
    color: "#A6FF00",
    fontSize: 34,
    fontWeight: "900",
  },

  aboutText: {
    color: "#C7D7ED",
    fontSize: 17,
    marginTop: 6,
    textAlign: "center",
  },

  version: {
    color: "#7188A8",
    fontSize: 13,
    marginTop: 12,
  },
});
