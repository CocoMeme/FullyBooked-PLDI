import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const OrderHistory = ({ orders }) => {
  if (!orders || orders.length === 0) {
    return <Text style={styles.noOrdersText}>No orders found.</Text>;
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.orderItem}>
          <Text>Order Number: {item.orderNumber}</Text>
          <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Total: ${item.total.toFixed(2)}</Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  noOrdersText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'gray',
  },
  orderItem: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
});

export default OrderHistory;