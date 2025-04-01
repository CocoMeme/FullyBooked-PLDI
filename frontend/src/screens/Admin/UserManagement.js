import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  FlatList,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Header from '../../components/Header';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import API_URL from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserManagement = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
  
      const token = await AsyncStorage.getItem('jwt'); // Retrieve the token
      if (!token) {
        throw new Error('JWT token not found');
      }
  
      // Replace API_URL with the localhost URL
      const response = await axios.get('http://192.168.112.70:3000/api/users', {
        headers: {
          Authorization: `Bearer ${token}`, // Include the JWT token
        },
      });
  
      setUsers(response.data); // Set the fetched users
    } catch (error) {
      console.error('Error fetching users:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userId) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, you would call the API to delete the user
              // await axios.delete(API_URL.DELETE_USER(userId));
              
              // For now, we'll just remove it from the local state
              setUsers(users.filter(user => user._id !== userId));
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        },
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.metaInfo}>
          <View style={styles.roleContainer}>
            <Text style={[
              styles.roleText, 
              item.role === 'admin' ? styles.adminRole : styles.customerRole
            ]}>
              {item.role.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.date}>
            Joined: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => Alert.alert('Info', 'Edit user feature coming soon')}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(item._id)}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="User Management" 
        showBackButton={true}
        rightComponent={(
          <TouchableOpacity onPress={() => Alert.alert('Info', 'Add user feature coming soon')}>
            <Ionicons name="person-add" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={(
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: SIZES.medium,
  },
  userItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  userInfo: {
    flex: 1,
  },
  username: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
    marginBottom: 4,
  },
  email: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleContainer: {
    borderRadius: SIZES.base / 2,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  roleText: {
    ...FONTS.medium,
    fontSize: SIZES.small - 2,
  },
  adminRole: {
    color: '#4CAF50',
  },
  customerRole: {
    color: '#2196F3',
  },
  date: {
    ...FONTS.regular,
    fontSize: SIZES.small - 2,
    color: COLORS.onBackground,
    opacity: 0.6,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: COLORS.secondary,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  emptyContainer: {
    padding: SIZES.extraLarge,
    alignItems: 'center',
  },
  emptyText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
    opacity: 0.6,
  },
});

export default UserManagement;