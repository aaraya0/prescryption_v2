import React from 'react';
import { useParams } from 'react-router-dom';

function Perfil() {
    const { userType } = useParams();

    return (
        <div>
            <h2>Perfil de {userType}</h2>
            <p>Aquí iría la información del perfil.</p>
        </div>
    );
}

export default Perfil;
