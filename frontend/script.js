document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reservaForm');
    const empleadoSelect = document.getElementById('empleado');
    const servicioSelect = document.getElementById('servicio');
    const fechaInput = document.getElementById('fecha');
    const horaSelect = document.getElementById('hora');
    const mensajeDiv = document.getElementById('mensaje');
    const listaReservas = document.getElementById('listaReservas');

    // Cargar empleados
    fetch('http://localhost:3000/api/reservas/empleados')
        .then(response => response.json())
        .then(empleados => {
            empleados.forEach(empleado => {
                const option = document.createElement('option');
                option.value = empleado.id;
                option.textContent = empleado.nombre;
                empleadoSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar empleados:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar empleados. Por favor, intente más tarde.',
            });
        });

    // Cargar servicios
    fetch('http://localhost:3000/api/reservas/servicios')
        .then(response => response.json())
        .then(servicios => {
            servicios.forEach(servicio => {
                const option = document.createElement('option');
                option.value = servicio.id;
                option.textContent = servicio.nombre;
                servicioSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar servicios:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar servicios. Por favor, intente más tarde.',
            });
        });

    // Función para actualizar horas disponibles
    function actualizarHorasDisponibles() {
        const empleadoId = empleadoSelect.value;
        const fecha = fechaInput.value;

        if (empleadoId && fecha) {
            fetch(`http://localhost:3000/api/reservas/disponibilidad?fecha=${fecha}&empleado_id=${empleadoId}`)
                .then(response => response.json())
                .then(data => {
                    horaSelect.innerHTML = '';
                    data.horasDisponibles.forEach(hora => {
                        const option = document.createElement('option');
                        option.value = hora;
                        option.textContent = hora;
                        horaSelect.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error('Error al obtener disponibilidad:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Error al obtener disponibilidad. Por favor, intente más tarde.',
                    });
                });
        }
    }

    empleadoSelect.addEventListener('change', actualizarHorasDisponibles);
    fechaInput.addEventListener('change', actualizarHorasDisponibles);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const empleado_id = empleadoSelect.value;
        const servicio_id = servicioSelect.value;
        const fecha = fechaInput.value;
        const hora = horaSelect.value;

        try {
            const response = await fetch('http://localhost:3000/api/reservas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cliente_nombre: nombre, empleado_id, servicio_id, fecha, hora }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            Swal.fire({
                icon: 'success',
                title: 'Reserva Confirmada',
                text: `Número de reserva: ${data.id}`,
            });
            form.reset();
            actualizarHorasDisponibles();
            cargarReservas();
        } catch (error) {
            console.error('Error al registrar reserva:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error al registrar la reserva. Por favor, intente nuevamente.',
            });
        }
    });

    // Función para cargar y mostrar las reservas
    function cargarReservas() {
        fetch('http://localhost:3000/api/reservas')
            .then(response => response.json())
            .then(reservas => {
                listaReservas.innerHTML = '';
                reservas.forEach(reserva => {
                    const li = document.createElement('li');
                    const fecha = new Date(reserva.fecha);
                    const fechaFormateada = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
                    li.innerHTML = `
                        Su reserva ${reserva.cliente_nombre} es con ${reserva.empleado_nombre} para el servicio "${reserva.servicio_nombre}" a las ${reserva.hora} horas del día ${fechaFormateada}
                        <button class="cancelar-btn" data-id="${reserva.id}">Cancelar</button>
                    `;
                    listaReservas.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Error al cargar reservas:', error);
                listaReservas.innerHTML = '<li>Error al cargar reservas. Por favor, intente más tarde.</li>';
            });
    }

    // Función para cancelar una reserva
    listaReservas.addEventListener('click', async (e) => {
        if (e.target.classList.contains('cancelar-btn')) {
            const id = e.target.getAttribute('data-id');
            
            Swal.fire({
                title: '¿Estás seguro?',
                text: "No podrás revertir esta acción",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cancelar reserva',
                cancelButtonText: 'No, mantener reserva'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetch(`http://localhost:3000/api/reservas/${id}`, {
                            method: 'DELETE'
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        Swal.fire(
                            'Cancelada',
                            'La reserva ha sido cancelada.',
                            'success'
                        );
                        cargarReservas();
                        actualizarHorasDisponibles();
                    } catch (error) {
                        console.error('Error al cancelar reserva:', error);
                        Swal.fire(
                            'Error',
                            'Error al cancelar la reserva. Por favor, intente nuevamente.',
                            'error'
                        );
                    }
                }
            });
        }
    });

    // Cargar reservas al iniciar la página
    cargarReservas();
});
