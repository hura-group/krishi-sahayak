import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { track } from '../../utils/analytics';

export default function AddExpenseScreen() {
  useEffect(() => {
    track('expense_added', { category: 'Fertilizer', amount_bucket: 'medium', has_receipt: true });
  }, []);

  return <View><Text>Add Expense Screen</Text></View>;
}