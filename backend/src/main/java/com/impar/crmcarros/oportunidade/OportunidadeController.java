package com.impar.crmcarros.oportunidade;

import com.impar.crmcarros.oportunidade.dto.OportunidadeRequest;
import com.impar.crmcarros.oportunidade.dto.OportunidadeResponse;
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
@RequestMapping("/api/oportunidades")
@RequiredArgsConstructor
@Tag(name = "Oportunidades")
public class OportunidadeController {

    private final OportunidadeService service;

    @GetMapping
    public Page<OportunidadeResponse> listar(
            @RequestParam(required = false) StatusOportunidade status,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long veiculoId,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return service.listar(status, clienteId, veiculoId, pageable);
    }

    @GetMapping("/{id}")
    public OportunidadeResponse buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OportunidadeResponse criar(@Valid @RequestBody OportunidadeRequest request) {
        return service.criar(request);
    }

    @PutMapping("/{id}")
    public OportunidadeResponse atualizar(@PathVariable Long id, @Valid @RequestBody OportunidadeRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
