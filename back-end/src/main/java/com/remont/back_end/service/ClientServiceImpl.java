package com.remont.back_end.service;

import com.remont.back_end.dto.ClientDTO;
import com.remont.back_end.model.Client;
import com.remont.back_end.repository.ClientRepository;
import com.remont.back_end.dto.ClientRegisterDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClientServiceImpl implements ClientService	{

    private final ClientRepository clientRepository;
    private final RegistrationService registrationService;

    public ClientServiceImpl(ClientRepository clientRepository, RegistrationService registrationService) {
        this.clientRepository = clientRepository;
        this.registrationService = registrationService;
    }
    
    @Override
    @Transactional
    public ClientDTO createClient(ClientDTO clientDTO) {
        ClientRegisterDTO registerDTO = new ClientRegisterDTO();
        registerDTO.setName(clientDTO.getName());
        registerDTO.setEmail(clientDTO.getEmail());
        registerDTO.setCpf(clientDTO.getCpf());
        registerDTO.setPhoneNumber(clientDTO.getPhoneNumber());
        registerDTO.setZipCode(clientDTO.getZipCode());
        registerDTO.setStreet(clientDTO.getStreet());
        registerDTO.setNumber(clientDTO.getNumber());
        registerDTO.setComplement(clientDTO.getComplement());
        registerDTO.setNeighborhood(clientDTO.getNeighborhood());
        registerDTO.setCity(clientDTO.getCity());
        registerDTO.setState(clientDTO.getState());
        return registrationService.registerNewClient(registerDTO);
    }

    @Override
    public ClientDTO getClientById(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID não pode ser nulo");
        }
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                        "Cliente não encontrado com ID: " + id));
        return convertToDTO(client);
    }

    public List<ClientDTO> getAllClients() {
        return clientRepository.findAllByActiveTrue()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ClientDTO updateClient(Long id, ClientDTO clientDTO) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID não pode ser nulo");
        }
        Client existingClient = clientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                        "Cliente não encontrado com ID: " + id));

        existingClient.setName(clientDTO.getName());
        existingClient.setEmail(clientDTO.getEmail());
        existingClient.setPhoneNumber(clientDTO.getPhoneNumber());
        
        existingClient.setZipCode(clientDTO.getZipCode());
        existingClient.setStreet(clientDTO.getStreet());
        existingClient.setNumber(clientDTO.getNumber());
        existingClient.setComplement(clientDTO.getComplement());
        existingClient.setNeighborhood(clientDTO.getNeighborhood());
        existingClient.setCity(clientDTO.getCity());
        existingClient.setState(clientDTO.getState());

        Client updatedClient = clientRepository.save(existingClient);
        return convertToDTO(updatedClient);
    }

    @Override
    @Transactional
    public void deleteClient(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID não pode ser nulo");
        }
        clientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Cliente não encontrado com ID: " + id));
        clientRepository.deactivateById(id);
    }

    private ClientDTO convertToDTO(Client client) {
        return new ClientDTO(
                client.getId(),
                client.getName(),
                client.getEmail(),
                client.getCpf(),
                client.getPhoneNumber(),
                client.getZipCode(),
                client.getStreet(),
                client.getNumber(),
                client.getComplement(),
                client.getNeighborhood(),
                client.getCity(),
                client.getState()
        );
    }

    private Client convertToEntity(ClientDTO dto) {
        Client client = new Client();
        client.setName(dto.getName());
        client.setEmail(dto.getEmail());
        client.setCpf(dto.getCpf());
        client.setPhoneNumber(dto.getPhoneNumber());
        client.setZipCode(dto.getZipCode());
        client.setStreet(dto.getStreet());
        client.setNumber(dto.getNumber());
        client.setComplement(dto.getComplement());
        client.setNeighborhood(dto.getNeighborhood());
        client.setCity(dto.getCity());
        client.setState(dto.getState());
        return client;
    }
}
