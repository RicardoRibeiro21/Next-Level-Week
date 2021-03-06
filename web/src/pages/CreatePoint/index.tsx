import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import './styles.css';
import { Link, useHistory} from 'react-router-dom';
import Logo from '../../assets/logo.svg';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, Marker, TileLayer } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import api from '../../services/api';
import axios from 'axios';

// array ou objeto: manualmente informar o tipo da variavel

interface Item {
    id: number,
    title: string,
    image_url: string
}

interface IBGEUfResponse {
    sigla: string
}

interface IBGECityResponse {
    nome: string
}

const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [selectedUf, setSelectedUf] = useState('0');
    const [cities, setCities] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedPosition, setSeletectedPosition] = useState<[number, number]>([0, 0]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [initialPosition, setinitialPosition] = useState<[number, number]>([0, 0]);
    const history = useHistory();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    })
    useEffect(() => {
        api.get('items')
            .then(response => {
                setItems(response.data);
            })
    }, [])

    useEffect(() => {
        axios.get<IBGEUfResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
            .then(response => {
                const ufInitials = response.data.map(uf => uf.sigla)

                setUfs(ufInitials);
            });
    }, [])

    useEffect(() => {
        if (selectedUf === '0') {
            return;
        }

        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
            .then(response => {
                const cityNames = response.data.map(city => city.nome)
                setCities(cityNames);
            });
    }, [selectedUf])

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            setinitialPosition([latitude, longitude]);
        })
    }, [])

    function handleSelectedUf(event: ChangeEvent<HTMLSelectElement>) {
        const uf = event.target.value;
        setSelectedUf(uf)
    }

    function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value;
        setSelectedCity(city)
    }

    function handleMapClick(event: LeafletMouseEvent) {
        setSeletectedPosition([
            event.latlng.lat,
            event.latlng.lng,
        ])
    };

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;

        setFormData({
            ...formData, [name]: value
        });
    }

    function handleSelectedItem(id: number) {
        // Verificando se o item já foi selecionado 
        const alreadySelected = selectedItems.findIndex(item => item === id)
        if (alreadySelected >= 0) {
            const filteredItems = selectedItems.filter(item => item !== id);

            setSelectedItems(filteredItems);
        } else {
            // Mantendo os items que já estão selecionados e passando um novo item
            setSelectedItems([...selectedItems, id]);
        }
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const { name, email, whatsapp} = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [ latitude, longitude] = selectedPosition;
        const items = selectedItems;
        const data = {
            name,
            email,
            uf,
            city,
            latitude,
            longitude,
            items,
            whatsapp            
        }

        await api.post('points', data);

        alert('Ponto de coleta cadastrado!');

        history.push('/');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={Logo} alt="Ecoleta"></img>
                <Link to="/">
                    <FiArrowLeft />
                    Voltar para a página inicial
                </Link>
            </header>
            <main>
                <form onSubmit={handleSubmit}>
                    <h1> Cadastro do <br /> ponto de coleta</h1>
                    <fieldset>
                        <legend>
                            <h2> Dados </h2>
                        </legend>
                        <div className="field">
                            <label htmlFor="name">Nome da entidade</label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                onChange={handleInputChange}>
                            </input>
                        </div>
                        <div className="field-group">
                            <div className="field">
                                <label htmlFor="email">E-mail</label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    onChange={handleInputChange}>
                                </input>
                            </div>
                            <div className="field">
                                <label htmlFor="whatsapp">Whatsapp</label>
                                <input
                                    type="text"
                                    name="whatsapp"
                                    id="whatsapp"
                                    onChange={handleInputChange}>
                                </input>
                            </div>
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>
                            <h2> Endereço </h2>
                            <span> Selecione o endereço no mapa</span>
                        </legend>

                        <Map center={initialPosition} zoom={13} onClick={handleMapClick}>
                            <TileLayer
                                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={selectedPosition} />
                        </Map>

                        <div className="field-group">
                            <div className="field">
                                <label htmlFor="uf"> Estado - UF</label>
                                <select
                                    name="uf"
                                    id="uf"
                                    value={selectedUf}
                                    onChange={handleSelectedUf}>
                                    <option value="0"> Selecione uma UF</option>
                                    {
                                        ufs.map(uf => {
                                            return (
                                                <option key={uf} value={uf}>{uf}</option>
                                            )
                                        })
                                    }
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="city"> Cidade </label>
                                <select
                                    name="city"
                                    id="city"
                                    value={selectedCity}
                                    onChange={handleSelectedCity}>
                                    <option value="0"> Selecione uma cidade</option>
                                    {
                                        cities.map(city => (
                                            <option key={city} value={city}> {city}</option>
                                        )
                                        )
                                    }
                                </select>
                            </div>
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>
                            <h2> Ítens em coleta </h2>
                            <span> Selecione um ou mais itens abaixo </span>
                        </legend>
                        <ul className="items-grid">
                            {
                                items.map(item => (
                                    <li
                                        key={item.id}
                                        onClick={() => handleSelectedItem(item.id)}
                                        className={selectedItems.includes(item.id) ? 'selected' : ''}>
                                        <img src={item.image_url} alt={item.title}></img>
                                        <span> {item.title}</span>
                                    </li>
                                ))
                            }
                        </ul>
                    </fieldset>
                    <button type="submit"> Cadastrar ponto de coleta </button>
                </form>
            </main>
        </div >
    )
}

export default CreatePoint;