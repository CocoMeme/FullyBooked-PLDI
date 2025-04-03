import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  FlatList,
  Platform,
  Modal,
  Button,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Header from '../../components/Header';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const API_URL = 'http://192.168.168.70:3000/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatedRole, setUpdatedRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('jwt');
      if (!token) {
        throw new Error('JWT token not found');
      }

      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error.message || error.response?.data);
      Alert.alert('Error', 'Failed to load users. Please check your network connection and API URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userId) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwt');
              if (!token) throw new Error('JWT token not found');

              await axios.delete(`${API_URL}/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

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

  const handleUpdateUserRole = async () => {
    if (!selectedUser) return;

    try {
      const token = await AsyncStorage.getItem('jwt');
      if (!token) throw new Error('JWT token not found');

      const response = await axios.put(
        `${API_URL}/users/update/${selectedUser._id}`,
        { role: updatedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = response.data.user;
      setUsers(users.map(user => (user._id === updatedUser._id ? updatedUser : user)));
      Alert.alert('Success', 'User role updated successfully');
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating user role:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update user role');
    }
  };

  const openUpdateModal = (user) => {
    setSelectedUser(user);
    setUpdatedRole(user.role);
    setModalVisible(true);
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
          onPress={() => openUpdateModal(item)}
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
        rightComponent={(~
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

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update User Role</Text>
            <Picker
              selectedValue={updatedRole}
              onValueChange={(itemValue) => setUpdatedRole(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Admin" value="admin" />
              <Picker.Item label="Customer" value="customer" />
              <Picker.Item label="Courier" value="courier" />
            </Picker>
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Update" onPress={handleUpdateUserRole} />
            </View>
          </View>
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  picker: {
    width: '100%',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});

export default UserManagement;