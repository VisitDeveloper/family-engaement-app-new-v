import { useStore } from "@/store";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Header({
  userImage,
  logo,
  link,
  // theme
}: {
  userImage: any;
  logo: any;
  link: any;
  // theme: Theme;
}) {
  const insets = useSafeAreaInsets();
  const theme = useStore((state) => state.theme);


  return (
    <View
      style={[
        styles.safeArea,
        { paddingTop: Math.min(insets.top, 10), backgroundColor: theme.bg, paddingBottom: 40, height:90  },
      ]}
    >
      <View style={styles.container}>
        {/* لوگو */}
        <View style={styles.logoWrapper}>
          {logo ? (
            <Image source={logo} style={styles.logo} />
          ) : (
            <View
              style={[
                styles.logoPlaceholder,
                { backgroundColor: theme.bg },
              ]}
            />
          )}
        </View>

        {/* تصویر کاربر */}
        <Link href={link} asChild>
          <TouchableOpacity style={styles.userWrapper}>
            {userImage ? (
              <Image
                source={userImage}
                style={[
                  styles.userImage,
                  { borderColor: theme.text },
                ]}
              />
            ) : (
              <FontAwesome5
                name="user-circle"
                size={50}
                color={theme.text}
              />
            )}
            <Feather
              name="settings"
              size={15}
              color={theme.text}
              style={[
                styles.iconSetting,
                { backgroundColor: theme.bg },
              ]}
            />
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const IMAGE_SIZE = 50;

const styles = StyleSheet.create({
  safeArea: {flex:1, height:90 , marginTop:0,marginBottom:5},
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  logoWrapper: {
    width: 150,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 40,
    resizeMode: "contain",
  },
  logoPlaceholder: {
    width: 150,
    height: 40,
    borderRadius: 8,
  },
  userWrapper: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  userImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    borderWidth: 2,
  },
  iconSetting: {
    position: "absolute",
    bottom: -6,
    right: -5,
    borderRadius: 50,
    padding: 4,
  },
});
