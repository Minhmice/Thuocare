import React from 'react';
import { useTheme } from 'react-native-paper';
import { Toast as ToastComponent, ToastProps } from '../../ui/toast';

export const Toast: React.FC<ToastProps> = (props) => {
  const theme = useTheme();

  return (
    <ToastComponent
      {...props}
    />
  );
};
