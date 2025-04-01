import { getFocusedRouteNameFromRoute } from "@react-navigation/native";

export const COLORS = {
  primary: '#FFC107', // Yellow primary
  primaryVariant: '#FFAB00', // Darker yellow
  secondary: '#FFD54F', // Light yellow
  secondaryVariant: '#FFB300', // Amber
  background: '#FFFFFF', // White background
  surface: '#FFFFFF', // White surface
  error: '#B00020', // Red for error
  green: '#4CAF50', // Green for success
  onPrimary: '#000000', // Text on yellow is black for better contrast
  onSecondary: '#000000',
  onBackground: '#000000',
  onSurface: '#000000',
  onError: '#FFFFFF',
};

export const SIZES = {
  base: 6,
  small: 10,
  font: 12,
  medium: 14,
  large: 16,
  extraLarge: 22,
};

export const FONTS = {
  regular: {
    fontFamily: 'Poppins-Regular',
    fontWeight: 'normal',
  },
  medium: {
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
  },
  semiBold: {
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
  },
  bold: {
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
  },
  extraBold: {
    fontFamily: 'Poppins-ExtraBold',
    fontWeight: '800',
  },
  light: {
    fontFamily: 'Poppins-Light',
    fontWeight: '300',
  },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 6.68,
    elevation: 14,
  },
};