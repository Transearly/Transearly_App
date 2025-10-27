import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Reusable Button Component
 * @param {string} title - Button text
 * @param {function} onPress - Callback function
 * @param {string} icon - Ionicons icon name
 * @param {string} variant - 'primary', 'secondary', or 'outline'
 */
export default function Button({ 
  title, 
  onPress, 
  icon, 
  variant = 'primary',
  style 
}) {
  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.primaryButton,
    variant === 'secondary' && styles.secondaryButton,
    variant === 'outline' && styles.outlineButton,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    variant === 'primary' && styles.primaryText,
    variant === 'secondary' && styles.secondaryText,
    variant === 'outline' && styles.outlineText,
  ];

  return (
    <TouchableOpacity style={buttonStyles} onPress={onPress}>
      {icon && (
        <Ionicons 
          name={icon} 
          size={20} 
          color={variant === 'outline' ? '#5B67F5' : '#fff'} 
          style={styles.icon}
        />
      )}
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#5B67F5',
  },
  secondaryButton: {
    backgroundColor: '#F0F2FF',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5B67F5',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#5B67F5',
  },
  outlineText: {
    color: '#5B67F5',
  },
  icon: {
    marginRight: 8,
  },
});
