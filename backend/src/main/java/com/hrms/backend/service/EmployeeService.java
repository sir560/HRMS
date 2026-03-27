package com.hrms.backend.service;

import com.hrms.backend.config.AuthenticatedUser;
import com.hrms.backend.dto.CreateDepartmentRequest;
import com.hrms.backend.dto.CreateDesignationRequest;
import com.hrms.backend.dto.CreateEmployeeRequest;
import com.hrms.backend.dto.DepartmentResponse;
import com.hrms.backend.dto.DesignationResponse;
import com.hrms.backend.dto.EmployeeDocumentResponse;
import com.hrms.backend.dto.EmployeePageResponse;
import com.hrms.backend.dto.EmployeeResponse;
import com.hrms.backend.dto.UpdateDesignationRequest;
import com.hrms.backend.dto.UpdateEmployeeRequest;
import com.hrms.backend.entity.Department;
import com.hrms.backend.entity.Designation;
import com.hrms.backend.entity.Employee;
import com.hrms.backend.entity.EmployeeDocument;
import com.hrms.backend.entity.EmploymentStatus;
import com.hrms.backend.exception.BadRequestException;
import com.hrms.backend.exception.ResourceNotFoundException;
import com.hrms.backend.repository.DepartmentRepository;
import com.hrms.backend.repository.DesignationRepository;
import com.hrms.backend.repository.EmployeeDocumentRepository;
import com.hrms.backend.repository.EmployeeRepository;
import jakarta.persistence.criteria.JoinType;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> ALLOWED_DOCUMENT_EXTENSIONS = Set.of("pdf", "png", "jpg", "jpeg", "doc", "docx");

    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeDocumentRepository employeeDocumentRepository;

    @Value("${app.storage.employee-documents-dir}")
    private String employeeDocumentsDir;

    @Value("${app.storage.employee-document-max-size-bytes}")
    private long employeeDocumentMaxSizeBytes;

    @Transactional
    public DepartmentResponse createDepartment(AuthenticatedUser principal, CreateDepartmentRequest request) {
        Long companyId = principal.getCompanyId();
        String departmentCode = normalizeCode(request.getDepartmentCode());
        String departmentName = request.getDepartmentName().trim();

        if (departmentRepository.existsByCompanyIdAndDepartmentCodeIgnoreCase(companyId, departmentCode)) {
            throw new BadRequestException("Department code already exists for this company");
        }
        if (departmentRepository.existsByCompanyIdAndDepartmentNameIgnoreCase(companyId, departmentName)) {
            throw new BadRequestException("Department name already exists for this company");
        }

        Department department = Department.builder()
                .departmentName(departmentName)
                .departmentCode(departmentCode)
                .description(trimToNull(request.getDescription()))
                .active(true)
                .build();
        department.setCompanyId(companyId);

        return toDepartmentResponse(departmentRepository.save(department));
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getDepartments(AuthenticatedUser principal) {
        return departmentRepository.findByCompanyIdOrderByDepartmentNameAsc(principal.getCompanyId()).stream()
                .map(this::toDepartmentResponse)
                .toList();
    }

    @Transactional
    public DesignationResponse createDesignation(AuthenticatedUser principal, CreateDesignationRequest request) {
        Long companyId = principal.getCompanyId();
        String designationCode = normalizeCode(request.getDesignationCode());
        String designationName = request.getDesignationName().trim();

        if (designationRepository.existsByCompanyIdAndDesignationCodeIgnoreCaseAndDeletedAtIsNull(companyId, designationCode)) {
            throw new BadRequestException("Designation code already exists for this company");
        }
        if (designationRepository.existsByCompanyIdAndDesignationNameIgnoreCaseAndDeletedAtIsNull(companyId, designationName)) {
            throw new BadRequestException("Designation name already exists for this company");
        }

        Designation designation = Designation.builder()
                .designationName(designationName)
                .designationCode(designationCode)
                .description(trimToNull(request.getDescription()))
                .active(true)
                .build();
        designation.setCompanyId(companyId);

        return toDesignationResponse(designationRepository.save(designation));
    }

    @Transactional(readOnly = true)
    public List<DesignationResponse> getDesignations(AuthenticatedUser principal) {
        return designationRepository.findByCompanyIdAndDeletedAtIsNullOrderByDesignationNameAsc(principal.getCompanyId()).stream()
                .map(this::toDesignationResponse)
                .toList();
    }

    @Transactional
    public DesignationResponse updateDesignation(
            AuthenticatedUser principal,
            Long designationId,
            UpdateDesignationRequest request
    ) {
        Long companyId = principal.getCompanyId();
        Designation designation = getDesignationForCompany(designationId, companyId);
        String designationCode = normalizeCode(request.getDesignationCode());
        String designationName = request.getDesignationName().trim();

        if (!designation.getDesignationCode().equalsIgnoreCase(designationCode)
                && designationRepository.existsByCompanyIdAndDesignationCodeIgnoreCaseAndDeletedAtIsNull(companyId, designationCode)) {
            throw new BadRequestException("Designation code already exists for this company");
        }
        if (!designation.getDesignationName().equalsIgnoreCase(designationName)
                && designationRepository.existsByCompanyIdAndDesignationNameIgnoreCaseAndDeletedAtIsNull(companyId, designationName)) {
            throw new BadRequestException("Designation name already exists for this company");
        }

        designation.setDesignationCode(designationCode);
        designation.setDesignationName(designationName);
        designation.setDescription(trimToNull(request.getDescription()));
        designation.setActive(request.getActive());
        return toDesignationResponse(designationRepository.save(designation));
    }

    @Transactional
    public void deleteDesignation(AuthenticatedUser principal, Long designationId) {
        Designation designation = getDesignationForCompany(designationId, principal.getCompanyId());
        long employeeCount = employeeRepository.countByDesignationEntity_DesignationIdAndCompanyIdAndDeletedAtIsNull(
                designationId,
                principal.getCompanyId()
        );
        if (employeeCount > 0) {
            throw new BadRequestException("Designation cannot be deleted while employees are assigned to it");
        }

        designation.setActive(false);
        designation.setDeletedAt(Instant.now());
        designationRepository.save(designation);
    }

    @Transactional
    public EmployeeResponse createEmployee(AuthenticatedUser principal, CreateEmployeeRequest request) {
        Long companyId = principal.getCompanyId();
        String employeeCode = normalizeCode(request.getEmployeeCode());
        String email = normalizeEmail(request.getEmail());

        if (employeeRepository.existsByCompanyIdAndEmployeeCodeIgnoreCaseAndDeletedAtIsNull(companyId, employeeCode)) {
            throw new BadRequestException("Employee code already exists for this company");
        }
        if (employeeRepository.existsByCompanyIdAndEmailIgnoreCaseAndDeletedAtIsNull(companyId, email)) {
            throw new BadRequestException("Employee email already exists for this company");
        }

        Department department = getDepartmentForCompany(request.getDepartmentId(), companyId);
        Designation designation = getDesignationForCompany(request.getDesignationId(), companyId);
        validateReferenceState(department.isActive(), "Department is inactive and cannot be assigned");
        validateReferenceState(designation.isActive(), "Designation is inactive and cannot be assigned");

        Employee employee = Employee.builder()
                .employeeCode(employeeCode)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(email)
                .phoneNumber(trimToNull(request.getPhoneNumber()))
                .designation(designation.getDesignationName())
                .dateOfJoining(request.getDateOfJoining())
                .employmentStatus(request.getEmploymentStatus())
                .active(true)
                .department(department)
                .designationEntity(designation)
                .build();
        employee.setCompanyId(companyId);

        return toEmployeeResponse(employeeRepository.save(employee), List.of());
    }

    @Transactional(readOnly = true)
    public EmployeePageResponse getEmployees(
            AuthenticatedUser principal,
            int page,
            int size,
            String search,
            Long departmentId,
            Long designationId,
            EmploymentStatus employmentStatus,
            Boolean active
    ) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = size <= 0 ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);
        PageRequest pageRequest = PageRequest.of(normalizedPage, normalizedSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<Employee> specification = buildEmployeeSpecification(
                principal.getCompanyId(),
                search,
                departmentId,
                designationId,
                employmentStatus,
                active
        );

        Page<Employee> employeePage = employeeRepository.findAll(specification, pageRequest);
        return EmployeePageResponse.builder()
                .content(employeePage.getContent().stream().map(employee -> toEmployeeResponse(employee, List.of())).toList())
                .page(employeePage.getNumber())
                .size(employeePage.getSize())
                .totalElements(employeePage.getTotalElements())
                .totalPages(employeePage.getTotalPages())
                .hasNext(employeePage.hasNext())
                .hasPrevious(employeePage.hasPrevious())
                .build();
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(AuthenticatedUser principal, Long employeeId) {
        Employee employee = getEmployeeForCompany(employeeId, principal.getCompanyId());
        return toEmployeeResponse(employee, getEmployeeDocumentsInternal(employeeId, principal.getCompanyId()));
    }

    @Transactional
    public EmployeeResponse updateEmployee(AuthenticatedUser principal, Long employeeId, UpdateEmployeeRequest request) {
        Long companyId = principal.getCompanyId();
        Employee employee = getEmployeeForCompany(employeeId, companyId);
        Department department = getDepartmentForCompany(request.getDepartmentId(), companyId);
        Designation designation = getDesignationForCompany(request.getDesignationId(), companyId);
        String normalizedEmail = normalizeEmail(request.getEmail());

        if (!employee.getEmail().equalsIgnoreCase(normalizedEmail)
                && employeeRepository.existsByCompanyIdAndEmailIgnoreCaseAndDeletedAtIsNull(companyId, normalizedEmail)) {
            throw new BadRequestException("Employee email already exists for this company");
        }

        validateReferenceState(department.isActive(), "Department is inactive and cannot be assigned");
        validateReferenceState(designation.isActive(), "Designation is inactive and cannot be assigned");

        employee.setFirstName(request.getFirstName().trim());
        employee.setLastName(request.getLastName().trim());
        employee.setEmail(normalizedEmail);
        employee.setPhoneNumber(trimToNull(request.getPhoneNumber()));
        employee.setDesignation(designation.getDesignationName());
        employee.setDesignationEntity(designation);
        employee.setDateOfJoining(request.getDateOfJoining());
        employee.setEmploymentStatus(request.getEmploymentStatus());
        employee.setActive(request.getActive());
        employee.setDepartment(department);

        Employee savedEmployee = employeeRepository.save(employee);
        return toEmployeeResponse(savedEmployee, getEmployeeDocumentsInternal(employeeId, companyId));
    }

    @Transactional
    public void deleteEmployee(AuthenticatedUser principal, Long employeeId) {
        Employee employee = getEmployeeForCompany(employeeId, principal.getCompanyId());
        employee.setActive(false);
        employee.setDeletedAt(Instant.now());
        employeeRepository.save(employee);

        Instant deletedAt = Instant.now();
        employeeDocumentRepository.findByEmployee_EmployeeIdAndCompanyIdAndDeletedAtIsNullOrderByCreatedAtDesc(
                        employeeId,
                        principal.getCompanyId()
                )
                .forEach(document -> {
                    document.setDeletedAt(deletedAt);
                    employeeDocumentRepository.save(document);
                    deleteStoredFileIfExists(document.getStoragePath());
                });
    }

    @Transactional(readOnly = true)
    public List<EmployeeDocumentResponse> getEmployeeDocuments(AuthenticatedUser principal, Long employeeId) {
        getEmployeeForCompany(employeeId, principal.getCompanyId());
        return getEmployeeDocumentsInternal(employeeId, principal.getCompanyId());
    }

    @Transactional
    public EmployeeDocumentResponse uploadEmployeeDocument(
            AuthenticatedUser principal,
            Long employeeId,
            MultipartFile file,
            String documentType
    ) {
        Employee employee = getEmployeeForCompany(employeeId, principal.getCompanyId());
        validateDocument(file);

        String originalFileName = sanitizeFileName(file.getOriginalFilename());
        String extension = fileExtension(originalFileName);
        String storedFileName = UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);
        Path companyDirectory = resolveCompanyStorageDirectory(principal.getCompanyId(), employeeId);
        Path storedFilePath = companyDirectory.resolve(storedFileName).normalize();

        try {
            Files.createDirectories(companyDirectory);
            Files.copy(file.getInputStream(), storedFilePath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new BadRequestException("Unable to store employee document");
        }

        EmployeeDocument employeeDocument = EmployeeDocument.builder()
                .employee(employee)
                .documentType(normalizeDocumentType(documentType))
                .originalFileName(originalFileName)
                .storedFileName(storedFileName)
                .contentType(resolveContentType(file))
                .fileSize(file.getSize())
                .storagePath(storedFilePath.toString())
                .uploadedByUserId(principal.getUserId())
                .build();
        employeeDocument.setCompanyId(principal.getCompanyId());

        return toEmployeeDocumentResponse(employeeDocumentRepository.save(employeeDocument), employeeId);
    }

    @Transactional
    public void deleteEmployeeDocument(AuthenticatedUser principal, Long employeeId, Long employeeDocumentId) {
        getEmployeeForCompany(employeeId, principal.getCompanyId());
        EmployeeDocument employeeDocument = getEmployeeDocumentForCompany(employeeDocumentId, employeeId, principal.getCompanyId());
        employeeDocument.setDeletedAt(Instant.now());
        employeeDocumentRepository.save(employeeDocument);
        deleteStoredFileIfExists(employeeDocument.getStoragePath());
    }

    @Transactional(readOnly = true)
    public EmployeeDocumentDownload downloadEmployeeDocument(AuthenticatedUser principal, Long employeeId, Long employeeDocumentId) {
        getEmployeeForCompany(employeeId, principal.getCompanyId());
        EmployeeDocument employeeDocument = getEmployeeDocumentForCompany(employeeDocumentId, employeeId, principal.getCompanyId());
        Path storedFilePath = Paths.get(employeeDocument.getStoragePath()).normalize();

        try {
            Resource resource = new UrlResource(storedFilePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Employee document file was not found");
            }
            return new EmployeeDocumentDownload(resource, employeeDocument.getContentType(), employeeDocument.getOriginalFileName());
        } catch (MalformedURLException exception) {
            throw new ResourceNotFoundException("Employee document file was not found");
        }
    }

    private Specification<Employee> buildEmployeeSpecification(
            Long companyId,
            String search,
            Long departmentId,
            Long designationId,
            EmploymentStatus employmentStatus,
            Boolean active
    ) {
        return (root, query, cb) -> {
            if (!Long.class.equals(query.getResultType()) && !long.class.equals(query.getResultType())) {
                root.fetch("department", JoinType.LEFT);
                root.fetch("designationEntity", JoinType.LEFT);
                query.distinct(true);
            }

            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("companyId"), companyId));
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (StringUtils.hasText(search)) {
                String queryValue = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("employeeCode")), queryValue),
                        cb.like(cb.lower(root.get("firstName")), queryValue),
                        cb.like(cb.lower(root.get("lastName")), queryValue),
                        cb.like(cb.lower(root.get("email")), queryValue),
                        cb.like(cb.lower(root.get("designation")), queryValue),
                        cb.like(cb.lower(root.join("department", JoinType.LEFT).get("departmentName")), queryValue)
                ));
            }

            if (departmentId != null) {
                predicates.add(cb.equal(root.get("department").get("departmentId"), departmentId));
            }
            if (designationId != null) {
                predicates.add(cb.equal(root.get("designationEntity").get("designationId"), designationId));
            }
            if (employmentStatus != null) {
                predicates.add(cb.equal(root.get("employmentStatus"), employmentStatus));
            }
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private Department getDepartmentForCompany(Long departmentId, Long companyId) {
        return departmentRepository.findByDepartmentIdAndCompanyId(departmentId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found for the provided tenant"));
    }

    private Designation getDesignationForCompany(Long designationId, Long companyId) {
        return designationRepository.findByDesignationIdAndCompanyIdAndDeletedAtIsNull(designationId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Designation not found for the provided tenant"));
    }

    private Employee getEmployeeForCompany(Long employeeId, Long companyId) {
        return employeeRepository.findByEmployeeIdAndCompanyIdAndDeletedAtIsNull(employeeId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found for the provided tenant"));
    }

    private EmployeeDocument getEmployeeDocumentForCompany(Long employeeDocumentId, Long employeeId, Long companyId) {
        return employeeDocumentRepository.findByEmployeeDocumentIdAndEmployee_EmployeeIdAndCompanyIdAndDeletedAtIsNull(
                        employeeDocumentId,
                        employeeId,
                        companyId
                )
                .orElseThrow(() -> new ResourceNotFoundException("Employee document not found for the provided tenant"));
    }

    private List<EmployeeDocumentResponse> getEmployeeDocumentsInternal(Long employeeId, Long companyId) {
        return employeeDocumentRepository.findByEmployee_EmployeeIdAndCompanyIdAndDeletedAtIsNullOrderByCreatedAtDesc(employeeId, companyId)
                .stream()
                .map(document -> toEmployeeDocumentResponse(document, employeeId))
                .toList();
    }

    private DepartmentResponse toDepartmentResponse(Department department) {
        long employeeCount = department.getEmployees() == null ? 0L : department.getEmployees().stream()
                .filter(employee -> employee.getDeletedAt() == null)
                .count();
        return DepartmentResponse.builder()
                .departmentId(department.getDepartmentId())
                .companyId(department.getCompanyId())
                .departmentName(department.getDepartmentName())
                .departmentCode(department.getDepartmentCode())
                .description(department.getDescription())
                .active(department.isActive())
                .employeeCount(employeeCount)
                .build();
    }

    private DesignationResponse toDesignationResponse(Designation designation) {
        long employeeCount = employeeRepository.countByDesignationEntity_DesignationIdAndCompanyIdAndDeletedAtIsNull(
                designation.getDesignationId(),
                designation.getCompanyId()
        );
        return DesignationResponse.builder()
                .designationId(designation.getDesignationId())
                .companyId(designation.getCompanyId())
                .designationName(designation.getDesignationName())
                .designationCode(designation.getDesignationCode())
                .description(designation.getDescription())
                .active(designation.isActive())
                .employeeCount(employeeCount)
                .build();
    }

    private EmployeeResponse toEmployeeResponse(Employee employee, List<EmployeeDocumentResponse> documents) {
        Department department = employee.getDepartment();
        Designation designation = employee.getDesignationEntity();
        return EmployeeResponse.builder()
                .employeeId(employee.getEmployeeId())
                .companyId(employee.getCompanyId())
                .employeeCode(employee.getEmployeeCode())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .email(employee.getEmail())
                .phoneNumber(employee.getPhoneNumber())
                .designationId(designation.getDesignationId())
                .designation(designation.getDesignationName())
                .dateOfJoining(employee.getDateOfJoining())
                .employmentStatus(employee.getEmploymentStatus())
                .active(employee.isActive())
                .department(DepartmentResponse.builder()
                        .departmentId(department.getDepartmentId())
                        .companyId(department.getCompanyId())
                        .departmentName(department.getDepartmentName())
                        .departmentCode(department.getDepartmentCode())
                        .description(department.getDescription())
                        .active(department.isActive())
                        .employeeCount(department.getEmployees() == null ? 0L : department.getEmployees().stream()
                                .filter(item -> item.getDeletedAt() == null)
                                .count())
                        .build())
                .documents(documents)
                .createdAt(employee.getCreatedAt())
                .updatedAt(employee.getUpdatedAt())
                .build();
    }

    private EmployeeDocumentResponse toEmployeeDocumentResponse(EmployeeDocument employeeDocument, Long employeeId) {
        return EmployeeDocumentResponse.builder()
                .employeeDocumentId(employeeDocument.getEmployeeDocumentId())
                .employeeId(employeeId)
                .companyId(employeeDocument.getCompanyId())
                .documentType(employeeDocument.getDocumentType())
                .originalFileName(employeeDocument.getOriginalFileName())
                .contentType(employeeDocument.getContentType())
                .fileSize(employeeDocument.getFileSize())
                .downloadUrl("/api/v1/employees/" + employeeId + "/documents/" + employeeDocument.getEmployeeDocumentId() + "/download")
                .createdAt(employeeDocument.getCreatedAt())
                .updatedAt(employeeDocument.getUpdatedAt())
                .build();
    }

    private void validateReferenceState(boolean active, String message) {
        if (!active) {
            throw new BadRequestException(message);
        }
    }

    private void validateDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Employee document file is required");
        }
        if (file.getSize() > employeeDocumentMaxSizeBytes) {
            throw new BadRequestException("Employee document exceeds the maximum allowed size");
        }
        String extension = fileExtension(sanitizeFileName(file.getOriginalFilename()));
        if (!ALLOWED_DOCUMENT_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Employee document type is not supported");
        }
    }

    private Path resolveCompanyStorageDirectory(Long companyId, Long employeeId) {
        return Paths.get(employeeDocumentsDir, String.valueOf(companyId), String.valueOf(employeeId)).normalize();
    }

    private void deleteStoredFileIfExists(String storagePath) {
        if (!StringUtils.hasText(storagePath)) {
            return;
        }
        try {
            Files.deleteIfExists(Paths.get(storagePath));
        } catch (IOException ignored) {
            // Best-effort file cleanup for soft-deleted documents.
        }
    }

    private String normalizeCode(String value) {
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeEmail(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String sanitizeFileName(String fileName) {
        String cleaned = StringUtils.hasText(fileName) ? fileName.trim() : "document";
        cleaned = cleaned.replace('\\', '_').replace('/', '_').replace("..", "_");
        return cleaned;
    }

    private String fileExtension(String fileName) {
        int extensionIndex = fileName.lastIndexOf('.');
        if (extensionIndex < 0 || extensionIndex == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(extensionIndex + 1).toLowerCase(Locale.ROOT);
    }

    private String normalizeDocumentType(String documentType) {
        if (!StringUtils.hasText(documentType)) {
            return "GENERAL";
        }
        return documentType.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
    }

    private String resolveContentType(MultipartFile file) {
        return StringUtils.hasText(file.getContentType()) ? file.getContentType() : "application/octet-stream";
    }

    public record EmployeeDocumentDownload(Resource resource, String contentType, String fileName) {
    }
}
