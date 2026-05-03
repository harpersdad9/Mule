import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export function StarRating({ rating, maxRating = 5, size = 20, interactive = false, onRate }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < rating;
        const star = <Text style={{ fontSize: size, color: filled ? Colors.starFilled : Colors.starEmpty }}>★</Text>;

        if (interactive && onRate) {
          return (
            <TouchableOpacity key={i} onPress={() => onRate(i + 1)} activeOpacity={0.7}>
              {star}
            </TouchableOpacity>
          );
        }
        return <View key={i}>{star}</View>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
