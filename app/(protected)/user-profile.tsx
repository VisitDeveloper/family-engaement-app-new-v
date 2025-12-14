import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { ApiError } from "@/services/api";
import { authService, UserProfile } from "@/services/auth.service";
import { useStore } from "@/store";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, TextInput, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
    const theme = useStore((state) => state.theme);
    const router = useRouter();
    const setUser = useStore((s) => s.setUser);
    const role = useStore((state) => state.role);
    
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const styles = useThemedStyles((theme) => ({
        container: { flex: 1, padding: 10, backgroundColor: theme.bg },
        containerScrollView: { flex: 1, backgroundColor: theme.bg },
        card: {
            borderWidth: 1,
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
            backgroundColor: theme.bg,
            borderColor: theme.border
        },
        avatar: { width: 90, height: 90, borderRadius: 45, alignSelf: "center", borderWidth: 1, borderColor: theme.border },
        cameraIcon: {
            position: "absolute",
            right: "38%",
            top: 65,
            backgroundColor: "#6200EE",
            padding: 6,
            borderRadius: 20,
        },
        name: { textAlign: "center", marginTop: 8, color: theme.text },
        subText: { textAlign: "center", marginBottom: 6, color: theme.subText },
        badge: {
            alignSelf: "center",
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 8,
            marginTop: 6,
            backgroundColor: theme.panel,
            borderColor: theme.border,
            borderWidth: 1
        },
        row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
        sectionTitle: { marginLeft: 6, color: theme.text },
        // fontSize: 14,
        label: { marginTop: 8, marginBottom: 4, color: theme.subText },
        input: {
            borderWidth: 1,
            borderRadius: 10,
            padding: 10,
            marginBottom: 10,
            fontSize: 14,
        },
        changeBtn: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderRadius: 10,
        },
    }));

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await authService.getProfile();
            
            // API returns ProfileResponse directly
            if (response.id) {
                const profileData: UserProfile = {
                    id: response.id,
                    email: response.email,
                    firstName: response.firstName,
                    lastName: response.lastName,
                    phoneNumber: response.phoneNumber,
                    phone: response.phoneNumber, // backward compatibility
                    profilePicture: response.profilePicture,
                    avatar: response.profilePicture, // backward compatibility
                    image: response.profilePicture, // backward compatibility
                    role: response.role,
                    createdAt: response.createdAt,
                    updatedAt: response.updatedAt,
                };
                setProfile(profileData);
                // به‌روزرسانی user در store
                const userData = {
                    ...profileData,
                    name: profileData.firstName || profileData.lastName 
                        ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim()
                        : profileData.email?.split('@')[0] || '',
                };
                setUser(userData);
            }
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'Failed to load profile. Please try again.';
            setError(errorMessage);
            
            // اگر خطای 401 یا 403 باشد، token باطل شده
            if (apiError.status === 401 || apiError.status === 403) {
                Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please login again.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                router.replace('/(auth)/login');
                            },
                        },
                    ]
                );
            }
        } finally {
            setLoading(false);
        }
    }, [role, setUser, router]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    if (error && !profile) {
        return (
            <View style={styles.container}>
                <HeaderInnerPage
                    title="Profile & Account Settings"
                    addstyles={{ marginBottom: 20 }}
                />
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <ThemedText type="error" style={{ textAlign: 'center', marginBottom: 20 }}>
                        {error}
                    </ThemedText>
                    <TouchableOpacity
                        onPress={fetchProfile}
                        style={{
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            backgroundColor: theme.tint,
                            borderRadius: 8,
                        }}
                    >
                        <ThemedText style={{ color: '#fff' }}>Retry</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const displayName = profile?.name || profile?.firstName || profile?.lastName
        ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
        : profile?.email?.split('@')[0] || 'User';

    return (
        <View style={styles.container}>

            <HeaderInnerPage
                title="Profile & Account Settings"
                addstyles={{ marginBottom: 20 }}
            />

            <ScrollView style={styles.containerScrollView}>

                {/* User Info */}
                <View style={styles.card}>
                    <Image 
                        source={profile?.profilePicture || profile?.avatar || profile?.image
                            ? { uri: profile.profilePicture || profile.avatar || profile.image } 
                            : { uri: "" }
                        } 
                        style={styles.avatar} 
                    />
                    <TouchableOpacity style={styles.cameraIcon}>
                        <Feather name="camera" size={18} color="#fff" />
                    </TouchableOpacity>
                    <ThemedText type="subtitle" style={styles.name}>
                        {displayName}
                    </ThemedText>
                    <ThemedText type="subText" style={styles.subText}>
                        {role 
                            ? `${role.charAt(0).toUpperCase() + role.slice(1)}` 
                            : 'No role assigned'
                        }
                    </ThemedText>
                    {profile?.email && (
                        <ThemedText type="subText" style={[styles.subText, { marginTop: 4 }]}>
                            {profile.email}
                        </ThemedText>
                    )}
                </View>

                {/* Contact */}
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Feather name="phone" size={18} color={theme.text} />
                        <ThemedText type="middleTitle" style={styles.sectionTitle}>Contact</ThemedText>
                    </View>
                    <ThemedText type="subText" style={styles.label}>Email</ThemedText>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.panel }]}
                        value={profile?.email || ''}
                        editable={false}
                        placeholder="No email available"
                        placeholderTextColor={theme.subText}
                    />
                    <ThemedText type="subText" style={styles.label}>Phone</ThemedText>
                    <View style={[styles.input, { flexDirection: "row", alignItems: "center", borderColor: theme.border, backgroundColor: theme.panel }]}>
                        {profile?.phoneNumber || profile?.phone ? (
                            <>
                                <ThemedText style={{ color: theme.text, marginRight: 8 }}>+1</ThemedText>
                                <ThemedText style={{ color: theme.text }}>{profile.phoneNumber || profile.phone}</ThemedText>
                            </>
                        ) : (
                            <ThemedText style={{ color: theme.subText }}>No phone number available</ThemedText>
                        )}
                    </View>
                </View>

                {/* Manage Password */}
                <View style={styles.card}>
                    <View style={styles.row}>
                        <MaterialIcons name="lock-outline" size={20} color={theme.text} />
                        <ThemedText type="middleTitle" style={styles.sectionTitle}>Manage Passwords</ThemedText>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/change-password')} style={[styles.changeBtn, { borderColor: theme.border }]}>
                        <ThemedText type="middleTitle" style={{ color: theme.text, fontWeight: "500" }}>Change Password</ThemedText>
                        <Feather name="chevron-right" size={18} color={theme.text} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

