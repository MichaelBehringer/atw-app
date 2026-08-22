import { useCallback, useState } from 'react';

// Hooks used for user authentication with Tokens
function useToken() {

  function getToken() {
    const userTokenLocal = localStorage.getItem('token');
    const userTokenSession = sessionStorage.getItem('token');
    return userTokenLocal ? userTokenLocal : userTokenSession ? userTokenSession : null;
  }

  const [token, setToken] = useState(getToken());

  // useCallback, damit die Funktionen ueber Renders hinweg stabil bleiben.
  // TokenContainer haengt einen Effekt daran; ohne das wuerde der bei jedem
  // Render neu laufen.
  const saveToken = useCallback((userToken, remember) => {
    if (remember) {
      localStorage.setItem('token', userToken);
    } else {
      sessionStorage.setItem('token', userToken);
    }
    setToken(userToken);
  }, []);

  const removeToken = useCallback(() => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setToken(null);
  }, []);

  return {
    setToken: saveToken,
    token,
    removeToken
  };
}

export default useToken;
