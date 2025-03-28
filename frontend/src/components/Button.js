import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';

/**
 * Reusable button component with loading state support
 * @param {Object} props - Component props
 * @param {string} props.title - Button text
 * @param {Function} props.onPress - Button press handler
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.variant - Button style variant ('primary', 'secondary', 'outline')
 * @param {Object} props.style - Additional style for the button
 * @param {Object} props.textStyle - Additional style for the button text
 */
const Button = ({
  title,
  onPress,
  isLoading = false,
  variant = 'primary',
  style,
  textStyle,
  ...rest
}) => {
  // Define button styles based on variant
  const getButtonStyles = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      default:
        return styles.primaryButton;
    }
  };

  // Define text styles based on variant
  const getTextStyles = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyles(), style]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.7}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? COLORS.primary : COLORS.onPrimary} 
          size={SIZES.medium} 
        />
      ) : (
        <Text style={[styles.text, getTextStyles(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: SIZES.medium,
    paddingHorizontal: SIZES.extraLarge,
    borderRadius: SIZES.base,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
    ...SHADOWS.small,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  text: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
  },
  primaryText: {
    color: COLORS.onPrimary,
  },
  secondaryText: {
    color: COLORS.onSecondary,
  },
  outlineText: {
    color: COLORS.primary,
  },
});

export default Button;