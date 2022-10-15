

module.exports = {
    async getFigById(request, response) {
        const { id } = request.params;

        // Verifica se o id do parametro existe dentro do banco
        // se existe retorna o id e o link da foto dele

        data = {
            id: id,
            image: "https://paninistickeralbum.fifa.com/assets/images/stickers/transparent/180-271f9e3f51ebe47f5084aad2e98b4d09967bfa99e21a00ea4141ff7dedc024fb.png"
        }
    return response.json(data);
    }
};