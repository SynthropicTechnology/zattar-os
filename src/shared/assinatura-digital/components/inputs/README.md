import { InputCPF, InputTelefone, InputCEP } from '@/components/assinatura-digital/inputs';

function MyForm() {
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState({});

  return (
    <>
      <InputCPF
        label="CPF"
        value={cpf}
        onChange={(e) => setCpf(e.target.value)}
        error={errors.cpf}
      />
      <InputCEP
        label="CEP"
        onAddressFound={(addr) => setAddress(addr)}
      />
    </>
  );
}