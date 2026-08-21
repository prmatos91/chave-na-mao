package com.impar.crmcarros.veiculo;

import com.impar.crmcarros.veiculo.dto.VeiculoRequest;
import com.impar.crmcarros.veiculo.dto.VeiculoResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/veiculos")
@RequiredArgsConstructor
@Tag(name = "Veiculos")
public class VeiculoController {

    private final VeiculoService service;

    @GetMapping
    public Page<VeiculoResponse> listar(
            @RequestParam(required = false) StatusVeiculo status,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return service.listar(status, q, pageable);
    }

    @GetMapping("/{id}")
    public VeiculoResponse buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VeiculoResponse criar(@Valid @RequestBody VeiculoRequest request) {
        return service.criar(request);
    }

    @PutMapping("/{id}")
    public VeiculoResponse atualizar(@PathVariable Long id, @Valid @RequestBody VeiculoRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
