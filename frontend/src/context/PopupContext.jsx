import { createContext, useContext, useState, useCallback } from 'react';

const PopupContext = createContext();

export const usePopup = () => useContext(PopupContext);

export const PopupProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    type: 'alert', // 'alert' or 'confirm'
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = useCallback((message, title = 'Aviso') => {
    setConfig({ type: 'alert', title, message, onConfirm: null, onCancel: null });
    setIsOpen(true);
  }, []);

  const showConfirm = useCallback((message, onConfirm, title = 'Confirmar', onCancel = null) => {
    setConfig({ type: 'confirm', title, message, onConfirm, onCancel });
    setIsOpen(true);
  }, []);

  const handleConfirm = () => {
    if (config.onConfirm) config.onConfirm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (config.onCancel) config.onCancel();
    setIsOpen(false);
  };

  return (
    <PopupContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {isOpen && (
        <dialog open>
          <article>
            <header>
              <button aria-label="Close" className="close" onClick={handleCancel}></button>
              <strong>{config.title}</strong>
            </header>
            <p>{config.message}</p>
            <footer>
              {config.type === 'confirm' && (
                <button className="secondary" onClick={handleCancel} style={{ marginRight: '1rem' }}>
                  Cancelar
                </button>
              )}
              <button onClick={handleConfirm}>Aceptar</button>
            </footer>
          </article>
        </dialog>
      )}
    </PopupContext.Provider>
  );
};
