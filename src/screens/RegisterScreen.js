import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import AuthService from '../services/auth';
import { ErrorHandler } from '../services/errorHandler';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !name) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await AuthService.register({ email, password, name });
      navigation.reset({ index: 0, routes: [{ name: 'Payments' }] });
    } catch (err) {
      setError(ErrorHandler.getUserFriendlyMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>Регистрация</Text>

        <TextInput label="Имя" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
        <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
        <TextInput label="Пароль" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry style={styles.input} />

        {error ? <HelperText type="error">{error}</HelperText> : null}

        <Button mode="contained" onPress={handleRegister} loading={loading} style={styles.button}>
          Зарегистрироваться
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { textAlign: 'center', marginBottom: 24 },
  input: { marginBottom: 16 },
  button: { marginTop: 16 }
});