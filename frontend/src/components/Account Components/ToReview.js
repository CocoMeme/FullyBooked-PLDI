import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { api } from '../../services/api';
import baseURL from '../../assets/common/baseurl';

const ToReview = ({ orders, navigation, userId }) => {
  const [booksDetails, setBooksDetails] = useState({});
  const [reviewsData, setReviewsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [deliveredOrders, setDeliveredOrders] = useState([]);

  // First useEffect to filter orders - runs when orders or userId changes
  useEffect(() => {
    console.log('ToReview - All orders received:', orders.length);
    console.log('ToReview - Current userId:', userId);
    
    // Check if userId is defined before filtering
    if (!userId) {
      console.log('ToReview - userId is undefined, cannot filter orders');
      setDeliveredOrders([]);
      return;
    }
    
    // Filter orders here instead of at component level
    const filteredOrders = orders.filter(order => {
      const orderUser = String(order.user);
      const currentUserId = String(userId);
      
      // Case-insensitive status comparison
      const isDelivered = 
        order.status?.toLowerCase() === 'delivered' || 
        order.status === 'Delivered';
      const isUsersOrder = orderUser === currentUserId;
      
      console.log(`Order ${order._id} - Status: ${order.status}, User: ${orderUser}, CurrentUser: ${currentUserId}`);
      console.log(`Order ${order._id} - isDelivered: ${isDelivered}, isUsersOrder: ${isUsersOrder}`);
      
      return isDelivered && isUsersOrder;
    });
    
    console.log('ToReview - Filtered delivered orders:', filteredOrders.length);
    setDeliveredOrders(filteredOrders);
  }, [orders, userId]); // Only depends on orders and userId, not on derived state

  // Second useEffect to fetch book details - runs when deliveredOrders changes
  useEffect(() => {
    const fetchBooksDetails = async () => {
      if (deliveredOrders.length === 0) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Extract all unique book IDs from filtered orders
        const bookIds = new Set();
        deliveredOrders.forEach(order => {
          order.items.forEach(item => {
            if (item.book) {
              // Handle both object and string cases
              const bookId = typeof item.book === 'object' ? item.book._id : item.book;
              console.log('Adding book ID to fetch for review:', bookId);
              bookIds.add(bookId);
            }
          });
        });
        
        // Fetch details for each book
        const booksData = {};
        await Promise.all(
          Array.from(bookIds).map(async (bookId) => {
            try {
              // Convert bookId to string to ensure it's a valid parameter
              const id = String(bookId);
              console.log('Fetching book details for review, ID:', id);
              
              // Use the api instance from api.js instead of direct axios calls
              const response = await api.get(`/books/${id}`);
              console.log(`Book ${id} fetch response:`, response.status, response.data?.success);
              
              if (response.data && response.data.book) {
                booksData[id] = response.data.book;
                console.log(`Successfully loaded book: ${response.data.book.title}`);
              } else {
                console.log(`No book data found for ID: ${id}`);
              }
            } catch (error) {
              console.error(`Error fetching details for book ${bookId}:`, error.message);
              console.log('Full error:', error);
            }
          })
        );
        
        console.log(`Loaded ${Object.keys(booksData).length} books out of ${bookIds.size} IDs`);
        setBooksDetails(booksData);
      } catch (error) {
        console.error('Error fetching books details for review:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooksDetails();
  }, [deliveredOrders]); // Only depends on finalized deliveredOrders state

  // Additional useEffect to fetch user's reviews for these books
  useEffect(() => {
    const fetchUserReviews = async () => {
      if (!userId || deliveredOrders.length === 0 || Object.keys(booksDetails).length === 0) {
        return;
      }
      
      try {
        // Get all book IDs from the delivered orders
        const bookIds = new Set();
        deliveredOrders.forEach(order => {
          order.items.forEach(item => {
            if (item.book) {
              const bookId = typeof item.book === 'object' ? item.book._id : item.book;
              bookIds.add(String(bookId));
            }
          });
        });
        
        // Fetch reviews for each book by this user
        const fetchedReviews = {};
        await Promise.all(
          Array.from(bookIds).map(async (bookId) => {
            try {
              const response = await api.get(`/reviews/user/${userId}/book/${bookId}`);
              
              // Check if the review exists based on the success flag
              if (response.data && response.data.success && response.data.review) {
                fetchedReviews[bookId] = response.data.review;
                console.log(`Found review for book ${bookId}:`, response.data.review);
              } else {
                console.log(`No review exists for book ${bookId}`);
              }
            } catch (error) {
              // Log errors but continue - we don't want to break the UI for one failed request
              console.log(`Error fetching review for book ${bookId}:`, error.message);
            }
          })
        );
        
        setReviewsData(fetchedReviews);
      } catch (error) {
        console.error('Error fetching user reviews:', error);
      }
    };

    fetchUserReviews();
  }, [userId, deliveredOrders, booksDetails]);

  // Function to format date to a readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to handle review button press
  const handleReviewPress = (order, item) => {
    const bookId = typeof item.book === 'object' ? item.book._id : item.book;
    const bookIdString = String(bookId);
    const bookDetails = booksDetails[bookIdString] || {};
    const isReviewed = item.isReviewed || false;

    if (isReviewed) {
      // Navigate to EditReview by explicitly targeting the Account stack
      navigation.navigate('Account', {
        screen: 'EditReview',
        params: {
          product: {
            _id: bookIdString,
            title: bookDetails.title || 'Unknown Book'
          },
          orderId: order._id
        }
      });
    } else {
      // Navigate to WriteReview similarly
      navigation.navigate('Account', {
        screen: 'WriteReview',
        params: {
          product: {
            _id: bookIdString,
            title: bookDetails.title || 'Unknown Book'
          },
          orderId: order._id
        }
      });
    }
  };

  // Helper function to render rating stars
  const renderRatingStars = (rating) => {
    return (
      <View style={styles.ratingStars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text
            key={star}
            style={[
              styles.starIcon,
              star <= rating ? styles.filledStar : styles.emptyStar
            ]}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  // Function to render each product item within an order
  const renderProductItem = (order, item) => {
    // Debug the item structure to see what we're working with
    console.log('Rendering order item:', {
      itemId: item._id,
      bookRef: item.book,
      bookRefType: typeof item.book,
    });
    
    // Get the book ID consistently regardless of format
    const bookId = typeof item.book === 'object' ? item.book._id : item.book;
    const bookIdString = String(bookId);
    
    console.log(`Looking for book details with ID: ${bookIdString}`);
    console.log(`Available book IDs in state:`, Object.keys(booksDetails));
    
    // Look up book details using the string ID
    const bookDetails = booksDetails[bookIdString] || {};
    const bookTitle = bookDetails.title || 'Loading...';
    const bookPrice = bookDetails.price || 0;
    const bookCover = bookDetails.coverImage?.[0] || null;
    
    console.log(`Book ${bookIdString} details found:`, {
      hasDetails: !!bookDetails._id,
      title: bookTitle,
      hasCover: !!bookCover
    });
    
    // Check if this item has already been reviewed
    const isReviewed = item.isReviewed || false;
    const buttonText = isReviewed ? "Edit" : "Rate";
    
    // Get the review if it exists
    const review = reviewsData[bookIdString];
    
    return (
      <View style={styles.productContainer}>
        <View style={styles.productInfo}>
          {bookCover ? (
            <Image 
              source={{ uri: bookCover }} 
              style={styles.productImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productImageText}>
                {bookTitle.charAt(0)}
              </Text>
            </View>
          )}
          
          <View style={styles.productDetails}>
            <Text style={styles.productTitle} numberOfLines={1}>
              {bookTitle}
            </Text>
            <Text style={styles.productQuantity}>
              Qty: {item.quantity} × ₱{bookPrice.toFixed(2)}
            </Text>
            
            {/* Show the review if it exists */}
            {review && (
              <View style={styles.reviewPreview}>
                {renderRatingStars(review.rating)}
                <Text style={styles.reviewComment} numberOfLines={2}>
                  "{review.comment}"
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={styles.reviewButton}
            onPress={() => handleReviewPress(order, item)}
            disabled={!bookDetails._id}
          >
            <Text style={styles.reviewButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Function to render each order item
  const renderOrderItem = ({ item: order }) => {
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>ORDER ID: {order._id.toUpperCase()}</Text>
            <Text style={styles.orderDate}>Delivered on: {formatDate(order.createdAt)}</Text>
          </View>
          <View style={styles.deliveredBadge}>
            <Text style={styles.statusText}>DELIVERED</Text>
          </View>
        </View>
        
        <Text style={styles.reviewPrompt}>Please rate your purchases:</Text>
        
        {order.items.map((item, index) => (
          <React.Fragment key={item._id || index}>
            {renderProductItem(order, item)}
            {index < order.items.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </View>
    );
  };

  // Show loading indicator while fetching book details
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  // Show a message if no delivered items to review
  if (deliveredOrders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>You don't have any delivered items to review.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={deliveredOrders}
      keyExtractor={item => item._id}
      renderItem={renderOrderItem}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: SIZES.small,
    paddingBottom: SIZES.extra_large,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.gray,
    marginTop: SIZES.small,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: SIZES.small,
  },
  orderNumber: {
    ...FONTS.semiBold,
    fontSize: SIZES.medium,
  },
  orderDate: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    opacity: 0.7,
    marginTop: 2,
  },
  deliveredBadge: {
    paddingHorizontal: SIZES.small,
    paddingVertical: 4,
    borderRadius: SIZES.small / 2,
    backgroundColor: COLORS.success + '20',
  },
  statusText: {
    ...FONTS.medium,
    fontSize: SIZES.small - 2,
    textTransform: 'uppercase',
  },
  reviewPrompt: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    marginBottom: SIZES.small,
  },
  productContainer: {
    marginVertical: SIZES.small,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productImage: {
    width: 50,
    height: 70,
    borderRadius: 4,
    backgroundColor: COLORS.lightGrey,
    marginRight: SIZES.small,
  },
  productImagePlaceholder: {
    width: 50,
    height: 70,
    borderRadius: 4,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.small,
  },
  productImageText: {
    ...FONTS.bold,
    color: COLORS.primary,
  },
  productDetails: {
    flex: 1,
    marginRight: SIZES.small,
  },
  productTitle: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
  },
  productQuantity: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    opacity: 0.8,
  },
  reviewButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.small / 2,
    paddingHorizontal: SIZES.medium,
    borderRadius: SIZES.small / 2,
    alignSelf: 'center',
  },
  reviewButtonText: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    color: '#fff',
  },
  reviewPreview: {
    marginTop: SIZES.small / 2,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  starIcon: {
    fontSize: 14,
    marginRight: 2,
  },
  filledStar: {
    color: COLORS.warning,
  },
  emptyStar: {
    color: COLORS.lightGrey,
  },
  reviewComment: {
    ...FONTS.regular,
    fontSize: SIZES.small - 1,
    fontStyle: 'italic',
    color: COLORS.darkgray,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: SIZES.small,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.extra_large,
  },
  emptyText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default ToReview;